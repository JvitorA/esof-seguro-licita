"""
Licita+ - Demonstração de requisitos de segurança contra casos de abuso
Somente biblioteca padrão do Python 3.8+ (nada para instalar).

Requisitos demonstrados:
  RS-02  Autorização central, negação por padrão (papel, empresa, dono do objeto, estado da licitação)
  RS-03  Login com MFA (TOTP, RFC 6238), bloqueio progressivo, sessões expiráveis e revogáveis
  RS-01  (versão mínima) Limitação de requisições (429) e recibo idempotente de proposta
  Auditoria com encadeamento de hash (detecta adulteração de logs)

Como rodar:   python licita_seguro.py
"""
import base64
import hashlib
import hmac
import json
import secrets
import struct
import time

# ----------------------------------------------------------------------------
# Relógio controlável (permite "avançar o tempo" nos testes sem esperar)
# ----------------------------------------------------------------------------
_deslocamento = 0.0


def agora():
    return time.time() + _deslocamento


def avancar(segundos):
    global _deslocamento
    _deslocamento += segundos


# ----------------------------------------------------------------------------
# Armazenamento em memória (no projeto real: banco de dados e repositório)
# ----------------------------------------------------------------------------
USUARIOS = {}      # login -> dados do usuário
EMPRESAS = {}      # nome -> dados cadastrais/bancários
LICITACOES = {}    # id -> licitação
PROPOSTAS = {}     # id -> proposta
RECIBOS = {}       # (login, chave_idempotencia) -> recibo
SESSOES = {}       # token -> sessão
TENTATIVAS = {}    # login -> {"falhas": n, "bloqueado_ate": t}
JANELAS = {}       # origem -> timestamps das requisições
AUDITORIA = []     # log encadeado por hash

# Parâmetros de segurança
MAX_FALHAS = 3             # falhas até começar a bloquear
BLOQUEIO_BASE = 30         # segundos; dobra a cada falha adicional
SESSAO_TTL = 900           # 15 minutos
LIMITE_REQ = 20            # requisições por janela, por origem
JANELA_REQ = 10            # segundos


# ----------------------------------------------------------------------------
# Auditoria com cadeia de hash (RS-02, RS-03 e CA-10)
# ----------------------------------------------------------------------------
def _hash_entrada(e):
    return hashlib.sha256(json.dumps(e, sort_keys=True).encode()).hexdigest()


def registrar(usuario, acao, resultado, detalhe=""):
    anterior = AUDITORIA[-1]["hash"] if AUDITORIA else "0" * 64
    e = {"ts": round(agora(), 1), "usuario": usuario, "acao": acao,
         "resultado": resultado, "detalhe": detalhe, "ant": anterior}
    e["hash"] = _hash_entrada(e)
    AUDITORIA.append(e)


def verificar_cadeia():
    anterior = "0" * 64
    for e in AUDITORIA:
        corpo = {k: v for k, v in e.items() if k != "hash"}
        if corpo["ant"] != anterior or _hash_entrada(corpo) != e["hash"]:
            return False
        anterior = e["hash"]
    return True


# ----------------------------------------------------------------------------
# MFA: TOTP (RFC 6238) implementado com hmac/hashlib
# ----------------------------------------------------------------------------
def totp(segredo_b32, instante=None, passo=30):
    chave = base64.b32decode(segredo_b32)
    contador = int((agora() if instante is None else instante) // passo)
    h = hmac.new(chave, struct.pack(">Q", contador), hashlib.sha1).digest()
    o = h[-1] & 0x0F
    codigo = (struct.unpack(">I", h[o:o + 4])[0] & 0x7FFFFFFF) % 1_000_000
    return f"{codigo:06d}"


def totp_valido(segredo, codigo):
    if not codigo:
        return False
    return any(hmac.compare_digest(totp(segredo, agora() + d * 30), str(codigo))
               for d in (-1, 0, 1))


# ----------------------------------------------------------------------------
# Usuários e login (RS-03)
# ----------------------------------------------------------------------------
def _hash_senha(senha, sal):
    return hashlib.pbkdf2_hmac("sha256", senha.encode(), sal, 100_000)


def criar_usuario(login, senha, papel, empresa=None):
    sal = secrets.token_bytes(16)
    USUARIOS[login] = {
        "login": login, "papel": papel, "empresa": empresa, "sal": sal,
        "hash": _hash_senha(senha, sal),
        "segredo_mfa": base64.b32encode(secrets.token_bytes(10)).decode(),
    }


_SAL_FALSO = secrets.token_bytes(16)
_HASH_FALSO = _hash_senha("x", _SAL_FALSO)


def login(login_, senha, codigo_mfa=None):
    """Retorna (status, corpo). Mensagem de erro genérica (não revela se foi senha ou MFA)."""
    t = TENTATIVAS.setdefault(login_, {"falhas": 0, "bloqueado_ate": 0})
    if agora() < t["bloqueado_ate"]:
        registrar(login_, "login", "BLOQUEADO", "tentativas excessivas")
        return 429, {"erro": "muitas tentativas; aguarde"}

    u = USUARIOS.get(login_)
    sal, esperado = (u["sal"], u["hash"]) if u else (_SAL_FALSO, _HASH_FALSO)
    senha_ok = hmac.compare_digest(_hash_senha(senha, sal), esperado) and u is not None
    mfa_ok = bool(u) and totp_valido(u["segredo_mfa"], codigo_mfa)

    if not (senha_ok and mfa_ok):
        t["falhas"] += 1
        if t["falhas"] >= MAX_FALHAS:
            espera = BLOQUEIO_BASE * 2 ** (t["falhas"] - MAX_FALHAS)
            t["bloqueado_ate"] = agora() + espera
        motivo = "mfa ausente/inválido" if senha_ok else "credenciais inválidas"
        registrar(login_, "login", "FALHA", motivo)
        return 401, {"erro": "credenciais inválidas"}

    TENTATIVAS[login_] = {"falhas": 0, "bloqueado_ate": 0}
    token = secrets.token_urlsafe(24)
    SESSOES[token] = {"login": login_, "expira": agora() + SESSAO_TTL, "revogada": False}
    registrar(login_, "login", "OK")
    return 200, {"token": token}


def revogar_sessao(token):
    if token in SESSOES:
        SESSOES[token]["revogada"] = True
        registrar(SESSOES[token]["login"], "sessao.revogar", "OK")


def _autenticar(token):
    s = SESSOES.get(token)
    if not s or s["revogada"] or agora() >= s["expira"]:
        return None
    return USUARIOS[s["login"]]


# ----------------------------------------------------------------------------
# Limitação de requisições (RS-01, versão mínima)
# ----------------------------------------------------------------------------
def _taxa_ok(origem):
    janela = [x for x in JANELAS.get(origem, []) if agora() - x < JANELA_REQ]
    if len(janela) >= LIMITE_REQ:
        JANELAS[origem] = janela
        return False
    janela.append(agora())
    JANELAS[origem] = janela
    return True


# ----------------------------------------------------------------------------
# POLÍTICA CENTRAL DE AUTORIZAÇÃO (RS-02) - negação por padrão
# ----------------------------------------------------------------------------
def pode(u, op, obj=None, lic=None):
    papel = u["papel"]
    encerrada = lic is not None and agora() >= lic["prazo_fim"]
    aberta = lic is not None and not encerrada

    if op == "proposta.criar":
        return papel == "fornecedor" and aberta
    if op == "proposta.ler":
        if papel == "fornecedor":
            return obj["empresa"] == u["empresa"]          # só a própria
        if papel == "comissao":
            return encerrada                               # só após o prazo (UC-08)
        return False
    if op in ("proposta.alterar", "proposta.excluir"):
        return (papel == "fornecedor" and obj["empresa"] == u["empresa"] and aberta)
    if op == "resultado.definir":
        return papel == "comissao" and encerrada and lic.get("resultado") is None
    if op == "empresa.ler_dados":
        return papel == "fornecedor" and obj["empresa"] == u["empresa"]
    if op == "auditoria.ler":
        return papel == "admin"
    return False   # qualquer outra operação (ex.: auditoria.apagar) é negada


# ----------------------------------------------------------------------------
# "API": todo pedido passa por taxa -> autenticação -> autorização -> execução
# ----------------------------------------------------------------------------
def requisicao(origem, token, op, **a):
    if not _taxa_ok(origem):
        return 429, {"erro": "limite de requisições excedido"}

    u = _autenticar(token)
    if not u:
        registrar("anônimo", op, "401", "sessão ausente/expirada/revogada")
        return 401, {"erro": "não autenticado"}

    obj = lic = None
    if op in ("proposta.ler", "proposta.alterar", "proposta.excluir"):
        obj = PROPOSTAS.get(a.get("id"))
        if not obj:
            return 404, {"erro": "não encontrado"}
        lic = LICITACOES[obj["licitacao_id"]]
    elif op in ("proposta.criar", "resultado.definir"):
        lic = LICITACOES.get(a.get("licitacao_id"))
        if not lic:
            return 404, {"erro": "não encontrado"}
    elif op == "empresa.ler_dados":
        obj = EMPRESAS.get(a.get("empresa"))
        if not obj:
            return 404, {"erro": "não encontrado"}

    if not pode(u, op, obj, lic):
        registrar(u["login"], op, "403", f"negado ({u['papel']})")
        return 403, {"erro": "proibido"}

    # --- execução (só chega aqui se autorizado) ---
    if op == "proposta.criar":
        chave = a.get("chave_idem")
        if chave and (u["login"], chave) in RECIBOS:               # idempotência
            return 200, RECIBOS[(u["login"], chave)]
        pid = f"P{len(PROPOSTAS) + 1}"
        # A empresa vem da SESSÃO, nunca do corpo da requisição (anti CA-03/CA-02)
        PROPOSTAS[pid] = {"id": pid, "licitacao_id": lic["id"],
                          "empresa": u["empresa"], "valor": a["valor"]}
        recibo = {"recibo": secrets.token_hex(6), "proposta": pid}
        if chave:
            RECIBOS[(u["login"], chave)] = recibo
        resposta = (201, recibo)
    elif op == "proposta.ler":
        resposta = (200, dict(obj))
    elif op == "proposta.alterar":
        obj["valor"] = a["valor"]
        resposta = (200, dict(obj))
    elif op == "proposta.excluir":
        del PROPOSTAS[obj["id"]]
        resposta = (200, {"ok": True})
    elif op == "resultado.definir":
        lic["resultado"] = {"vencedor": a["vencedor"], "justificativa": a["justificativa"]}
        resposta = (200, lic["resultado"])
    elif op == "empresa.ler_dados":
        resposta = (200, dict(obj))
    elif op == "auditoria.ler":
        resposta = (200, list(AUDITORIA))
    registrar(u["login"], op, "OK")
    return resposta


# ============================================================================
# TESTES DE CASOS DE ABUSO
# ============================================================================
_total = _ok = 0


def checar(titulo, obtido, esperado):
    global _total, _ok
    _total += 1
    passou = obtido == esperado
    _ok += passou
    print(f"  [{'PASSOU' if passou else 'FALHOU'}] {titulo}  (obtido={obtido}, esperado={esperado})")


def entrar(nome, senha):
    st, corpo = login(nome, senha, totp(USUARIOS[nome]["segredo_mfa"]))
    assert st == 200, f"login de {nome} falhou"
    return corpo["token"]


def secao(txt):
    print(f"\n=== {txt}")


def main():
    # ---------- preparação ----------
    criar_usuario("ana", "SenhaAna#1", "fornecedor", "Alfa")
    criar_usuario("beto", "SenhaBeto#1", "fornecedor", "Beta")
    criar_usuario("sergio", "SenhaServ#1", "servidor")
    criar_usuario("carla", "SenhaCom#1", "comissao")
    criar_usuario("admin", "SenhaAdm#1", "admin")
    EMPRESAS["Alfa"] = {"empresa": "Alfa", "cnpj": "11.111.111/0001-11", "banco": "AG 001 CC 111-1"}
    EMPRESAS["Beta"] = {"empresa": "Beta", "cnpj": "22.222.222/0001-22", "banco": "AG 002 CC 222-2"}
    LICITACOES["L1"] = {"id": "L1", "prazo_fim": agora() + 3600, "resultado": None}

    t_ana = entrar("ana", "SenhaAna#1")
    t_beto = entrar("beto", "SenhaBeto#1")
    t_serv = entrar("sergio", "SenhaServ#1")
    t_com = entrar("carla", "SenhaCom#1")
    t_adm = entrar("admin", "SenhaAdm#1")

    secao("Operações legítimas (devem ser permitidas)")
    st, rec = requisicao("ip-ana", t_ana, "proposta.criar", licitacao_id="L1", valor=100000, chave_idem="ana-1")
    checar("Ana (Alfa) envia proposta com licitação aberta", st, 201)
    pid_ana = rec["proposta"]
    st, rec_beto = requisicao("ip-beto", t_beto, "proposta.criar", licitacao_id="L1", valor=95000)
    checar("Beto (Beta) envia proposta", st, 201)
    checar("Ana lê a própria proposta", requisicao("ip-ana", t_ana, "proposta.ler", id=pid_ana)[0], 200)
    checar("Ana altera a própria proposta antes do prazo",
           requisicao("ip-ana", t_ana, "proposta.alterar", id=pid_ana, valor=98000)[0], 200)
    checar("Ana lê os próprios dados cadastrais",
           requisicao("ip-ana", t_ana, "empresa.ler_dados", empresa="Alfa")[0], 200)
    checar("Admin consulta logs de auditoria",
           requisicao("ip-adm", t_adm, "auditoria.ler")[0], 200)

    secao("CA-01 Acessar proposta antes do prazo")
    checar("Comissão tenta ler proposta com prazo aberto", requisicao("ip-c", t_com, "proposta.ler", id=pid_ana)[0], 403)
    checar("Servidor tenta ler proposta com prazo aberto", requisicao("ip-s", t_serv, "proposta.ler", id=pid_ana)[0], 403)
    checar("Admin tenta ler proposta com prazo aberto", requisicao("ip-adm", t_adm, "proposta.ler", id=pid_ana)[0], 403)
    checar("Concorrente (Beto) tenta ler proposta da Ana", requisicao("ip-beto", t_beto, "proposta.ler", id=pid_ana)[0], 403)

    secao("CA-02 Alterar proposta de outra empresa / CA-06 Excluir proposta")
    checar("Beto tenta alterar proposta da Ana", requisicao("ip-beto", t_beto, "proposta.alterar", id=pid_ana, valor=1)[0], 403)
    checar("Valor da proposta da Ana permanece intacto", PROPOSTAS[pid_ana]["valor"], 98000)
    checar("Beto tenta excluir proposta da Ana", requisicao("ip-beto", t_beto, "proposta.excluir", id=pid_ana)[0], 403)
    checar("Proposta da Ana continua existindo", pid_ana in PROPOSTAS, True)

    secao("CA-03 Enviar proposta em nome de outra empresa")
    st, r = requisicao("ip-beto", t_beto, "proposta.criar", licitacao_id="L1", valor=5, empresa="Alfa")
    checar("Beto informa empresa='Alfa' no corpo; sistema ignora e usa a da sessão",
           PROPOSTAS[r["proposta"]]["empresa"], "Beta")
    st, _ = login("ana", "SenhaAna#1")
    checar("Senha roubada SEM código MFA não cria sessão", st, 401)
    st, _ = login("ana", "SenhaAna#1", "000000")
    checar("Senha roubada com MFA inválido não cria sessão", st, 401)
    checar("Token forjado é recusado", requisicao("ip-x", "token-falso", "proposta.ler", id=pid_ana)[0], 401)

    secao("CA-05 Elevar privilégios")
    checar("Fornecedor tenta definir resultado", requisicao("ip-ana", t_ana, "resultado.definir", licitacao_id="L1", vencedor="Alfa", justificativa="x")[0], 403)
    checar("Fornecedor tenta ler auditoria", requisicao("ip-ana", t_ana, "auditoria.ler")[0], 403)
    checar("Servidor tenta definir resultado", requisicao("ip-s", t_serv, "resultado.definir", licitacao_id="L1", vencedor="Beta", justificativa="x")[0], 403)

    secao("CA-09 Acessar dados de outras empresas")
    checar("Beto tenta ler dados bancários da Alfa", requisicao("ip-beto", t_beto, "empresa.ler_dados", empresa="Alfa")[0], 403)
    checar("Servidor tenta ler dados bancários da Alfa", requisicao("ip-s", t_serv, "empresa.ler_dados", empresa="Alfa")[0], 403)

    secao("RS-01 Recibo idempotente (envio repetido não duplica proposta)")
    st, r2 = requisicao("ip-ana", t_ana, "proposta.criar", licitacao_id="L1", valor=98000, chave_idem="ana-1")
    checar("Reenvio com a mesma chave devolve o MESMO recibo", r2["proposta"], pid_ana)
    checar("Ana continua com apenas 1 proposta", sum(1 for p in PROPOSTAS.values() if p["empresa"] == "Alfa"), 1)

    secao("CA-11 Sobrecarregar o sistema (limite de requisições)")
    codigos = [requisicao("ip-atacante", t_ana, "proposta.ler", id=pid_ana)[0] for _ in range(40)]
    checar("Rajada de 40 requisições: excedentes recebem 429", codigos.count(429), 40 - LIMITE_REQ)
    checar("Usuário legítimo de outra origem continua atendido", requisicao("ip-beto", t_beto, "proposta.ler", id=rec_beto["proposta"])[0], 200)

    secao("CA-04 Roubar credenciais por adivinhação de senha")
    codigos = [login("beto", f"chute{i}", totp(USUARIOS['beto']['segredo_mfa']))[0] for i in range(MAX_FALHAS)]
    checar("Tentativas erradas retornam 401", codigos, [401] * MAX_FALHAS)
    st, _ = login("beto", "SenhaBeto#1", totp(USUARIOS["beto"]["segredo_mfa"]))
    checar("Após o limite, até a senha correta é bloqueada (429)", st, 429)
    avancar(BLOQUEIO_BASE + 1)
    st, _ = login("beto", "SenhaBeto#1", totp(USUARIOS["beto"]["segredo_mfa"]))
    checar("Passado o tempo de bloqueio, o login legítimo volta a funcionar", st, 200)

    secao("Sessões: revogação e expiração")
    t_tmp = entrar("ana", "SenhaAna#1")
    checar("Sessão nova funciona", requisicao("ip-ana", t_tmp, "proposta.ler", id=pid_ana)[0], 200)
    revogar_sessao(t_tmp)
    checar("Sessão revogada é recusada", requisicao("ip-ana", t_tmp, "proposta.ler", id=pid_ana)[0], 401)
    avancar(SESSAO_TTL + 1)
    checar("Sessão expirada é recusada", requisicao("ip-ana", t_ana, "proposta.ler", id=pid_ana)[0], 401)

    secao("Após o encerramento do prazo")
    avancar(4000)  # prazo da L1 encerrado
    t_ana, t_com, t_serv = entrar("ana", "SenhaAna#1"), entrar("carla", "SenhaCom#1"), entrar("sergio", "SenhaServ#1")
    checar("Comissão agora pode ler a proposta (UC-08/UC-09)", requisicao("ip-c", t_com, "proposta.ler", id=pid_ana)[0], 200)
    checar("Ana não pode alterar proposta após o prazo (UC-07)", requisicao("ip-ana", t_ana, "proposta.alterar", id=pid_ana, valor=1)[0], 403)
    checar("Ana não pode enviar proposta fora do prazo", requisicao("ip-ana", t_ana, "proposta.criar", licitacao_id="L1", valor=1)[0], 403)

    secao("CA-07 Modificar o resultado da licitação")
    st, _ = requisicao("ip-c", t_com, "resultado.definir", licitacao_id="L1", vencedor="Beta", justificativa="menor preço válido")
    checar("Comissão define o vencedor (legítimo)", st, 200)
    checar("Comissão NÃO consegue sobrescrever o resultado já registrado",
           requisicao("ip-c", t_com, "resultado.definir", licitacao_id="L1", vencedor="Alfa", justificativa="troca")[0], 403)
    checar("Servidor tenta alterar o resultado", requisicao("ip-s", t_serv, "resultado.definir", licitacao_id="L1", vencedor="Alfa", justificativa="troca")[0], 403)
    checar("Vencedor registrado permanece 'Beta'", LICITACOES["L1"]["resultado"]["vencedor"], "Beta")

    secao("CA-10 Apagar ou alterar logs")
    t_adm = entrar("admin", "SenhaAdm#1")
    checar("Admin tenta apagar logs (operação negada até para ele)", requisicao("ip-adm", t_adm, "auditoria.apagar")[0], 403)
    checar("Cadeia de hash do log íntegra", verificar_cadeia(), True)
    AUDITORIA[3]["usuario"] = "ninguem"   # simula adulteração direta no armazenamento
    checar("Adulteração direta do log é DETECTADA pela cadeia de hash", verificar_cadeia(), False)

    print(f"\n{'=' * 60}\nRESULTADO: {_ok}/{_total} verificações passaram")
    negados = sum(1 for e in AUDITORIA if e["resultado"] in ("403", "401", "BLOQUEADO", "FALHA"))
    print(f"Eventos de recusa/falha registrados na auditoria: {negados}")
    print("\nÚltimos eventos de auditoria:")
    for e in AUDITORIA[-6:]:
        print(f"  {e['ts']:.0f} | {e['usuario']:<8} | {e['acao']:<18} | {e['resultado']:<9} | {e['detalhe']}")


if __name__ == "__main__":
    main()
