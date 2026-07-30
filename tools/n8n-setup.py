# -*- coding: utf-8 -*-
"""
Da de alta el cotizador en n8n: crea las credenciales, importa los dos
workflows y los activa.

    python tools/n8n-setup.py --check      solo verifica la conexion
    python tools/n8n-setup.py --creds      crea/actualiza las credenciales
    python tools/n8n-setup.py --deploy     importa y activa los workflows
    python tools/n8n-setup.py --all        todo junto

Lee los secretos de .n8n.env (gitignoreado, excluido del deploy) y NUNCA
los imprime: solo muestra ids y codigos de estado. Es idempotente: si un
workflow o credencial ya existe con el mismo nombre, lo actualiza en vez
de duplicarlo.

Cuando termines, borra .n8n.env: las credenciales ya quedan guardadas
cifradas dentro de n8n.
"""
import io, json, os, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(ROOT, '.n8n.env')

# Nombres de las credenciales. Tienen que coincidir con los que esperan
# los JSON de n8n/ (ver la constante CRED_* del generador).
CRED_NOTION = 'Notion - Cotizador'
CRED_PDF    = 'ChichaLabs - PDF cotizador'
CRED_SMTP   = 'Hostinger - notificaciones@chichalabs.studio'

WORKFLOWS = [
    ('n8n/cotizador-api-liviana.json', 'Cotizador - API liviana'),
    ('n8n/cotizador-propuesta.json',   'Cotizador - Propuesta (PDF + email)'),
]


def cargar_env():
    if not os.path.exists(ENV_PATH):
        sys.exit('Falta .n8n.env (copiar de .n8n.env.example y completar)')
    env = {}
    for line in io.open(ENV_PATH, encoding='utf-8'):
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()
    if not env.get('N8N_URL') or not env.get('N8N_API_KEY'):
        sys.exit('Faltan N8N_URL o N8N_API_KEY en .n8n.env')
    return env


ENV = cargar_env()
BASE = ENV['N8N_URL'].rstrip('/')


def api(path, method='GET', body=None):
    """Devuelve (status, json|texto). No loguea nada del body."""
    req = urllib.request.Request(
        BASE + path, method=method,
        headers={'X-N8N-API-KEY': ENV['N8N_API_KEY'],
                 'Content-Type': 'application/json',
                 'Accept': 'application/json'},
        data=json.dumps(body).encode('utf-8') if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            txt = r.read().decode('utf-8')
            return r.status, (json.loads(txt) if txt.strip() else {})
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')[:400]
    except Exception as e:
        return 0, str(e)


def check():
    st, data = api('/api/v1/workflows?limit=100')
    if st != 200:
        print('  [x] la API no responde:', st, data)
        return None
    wfs = data.get('data', [])
    print('  [ok] API de n8n conectada -', len(wfs), 'workflows en la instancia')
    for w in wfs:
        print('       -', w['name'], '| activo:', w['active'])
    return wfs


def credenciales_existentes():
    """La API publica de n8n no permite listar credenciales; llevamos el
       registro de las que creamos en tools/.n8n-ids.json."""
    p = os.path.join(ROOT, 'tools', '.n8n-ids.json')
    return json.load(io.open(p, encoding='utf-8')) if os.path.exists(p) else {}


def guardar_ids(ids):
    p = os.path.join(ROOT, 'tools', '.n8n-ids.json')
    json.dump(ids, io.open(p, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)


def crear_credencial(nombre, tipo, data, clave=None, ids=None, force=False):
    """La API publica de n8n no permite listar credenciales, asi que si
       volvemos a correr --creds crearia duplicados. Nos guiamos por los ids
       que anotamos en tools/.n8n-ids.json; con --force se recrean igual."""
    if ids and clave and ids.get(clave) and not force:
        print('  [--] ya existe: %-45s id=%s (usar --force para recrear)'
              % (nombre, ids[clave]))
        return ids[clave]

    st, r = api('/api/v1/credentials', 'POST',
                {'name': nombre, 'type': tipo, 'data': data})
    if st in (200, 201):
        cid = r.get('id')
        print('  [ok] credencial creada: %-45s id=%s' % (nombre, cid))
        return cid
    print('  [x] fallo al crear "%s": %s %s' % (nombre, st, r))
    return None


def creds(force=False):
    ids = credenciales_existentes()

    if ENV.get('NOTION_TOKEN'):
        cid = crear_credencial(CRED_NOTION, 'httpHeaderAuth', {
            'name': 'Authorization',
            'value': 'Bearer ' + ENV['NOTION_TOKEN']}, 'notion', ids, force)
        if cid: ids['notion'] = cid
    else:
        print('  [--] NOTION_TOKEN vacio: la credencial de Notion hay que crearla a mano')

    if ENV.get('COTIZADOR_PDF_SECRET'):
        cid = crear_credencial(CRED_PDF, 'httpHeaderAuth', {
            'name': 'X-Cotizador-Key',
            'value': ENV['COTIZADOR_PDF_SECRET']}, 'pdf', ids, force)
        if cid: ids['pdf'] = cid
    else:
        print('  [--] COTIZADOR_PDF_SECRET vacio')

    if ENV.get('SMTP_PASS'):
        puerto = int(ENV.get('SMTP_PORT') or 465)
        cid = crear_credencial(CRED_SMTP, 'smtp', {
            'user': ENV.get('SMTP_USER', 'notificaciones@chichalabs.studio'),
            'password': ENV['SMTP_PASS'],
            'host': ENV.get('SMTP_HOST', 'smtp.hostinger.com'),
            'port': puerto,
            'secure': puerto == 465,
            'disableStartTls': False}, 'smtp', ids, force)
        if cid: ids['smtp'] = cid
    else:
        print('  [--] SMTP_PASS vacio: sin esto el envio de email no funciona')

    guardar_ids(ids)
    return ids


def deploy():
    ids = credenciales_existentes()
    if not ids:
        print('  [x] no hay ids de credenciales; corre primero --creds')
        return
    existentes = {w['name']: w['id'] for w in (check() or [])}

    # placeholder del JSON -> (id real en n8n, nombre real de la credencial)
    mapa = {'REEMPLAZAR_ID_CRED_NOTION': (ids.get('notion'), CRED_NOTION),
            'REEMPLAZAR_ID_CRED_PDF':    (ids.get('pdf'),    CRED_PDF),
            'REEMPLAZAR_ID_CRED_SMTP':   (ids.get('smtp'),   CRED_SMTP)}

    for archivo, nombre in WORKFLOWS:
        wf = json.load(io.open(os.path.join(ROOT, archivo), encoding='utf-8'))

        faltan = []
        for n in wf['nodes']:
            for tipo, cred in (n.get('credentials') or {}).items():
                real, real_nombre = mapa.get(cred.get('id'), (None, None))
                if real:
                    cred['id'] = real
                    cred['name'] = real_nombre
                else:
                    faltan.append(n['name'])
        if faltan:
            print('  [!] "%s": sin credencial -> %s' % (nombre, ', '.join(sorted(set(faltan)))))

        # La API publica solo acepta estos campos al crear/actualizar.
        cuerpo = {'name': wf['name'], 'nodes': wf['nodes'],
                  'connections': wf['connections'], 'settings': wf.get('settings', {})}

        wid = existentes.get(wf['name'])
        if wid:
            st, r = api('/api/v1/workflows/' + wid, 'PUT', cuerpo)
            accion = 'actualizado'
        else:
            st, r = api('/api/v1/workflows', 'POST', cuerpo)
            accion = 'creado'
            wid = r.get('id') if isinstance(r, dict) else None

        if st not in (200, 201):
            print('  [x] "%s": %s %s' % (nombre, st, r))
            continue
        print('  [ok] workflow %s: %-40s id=%s' % (accion, wf['name'], wid))

        sta, ra = api('/api/v1/workflows/%s/activate' % wid, 'POST')
        print('       activado' if sta == 200 else '       [x] no se pudo activar: %s %s' % (sta, ra))


if __name__ == '__main__':
    args = sys.argv[1:] or ['--check']
    print('n8n:', BASE)
    if '--check' in args or '--all' in args:
        print('\n[1] Conexion'); check()
    if '--creds' in args or '--all' in args:
        print('\n[2] Credenciales'); creds()
    if '--deploy' in args or '--all' in args:
        print('\n[3] Workflows'); deploy()
