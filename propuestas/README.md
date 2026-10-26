# Propuestas para clientes

Cada propuesta es una página estática que replica el PDF que se le manda al
cliente, pensada para abrirse desde el celular. Se comparte por link:

```
https://chichalabs.studio/propuestas/<cliente>-<código>/
```

```
propuestas/
  propuesta.css            — estilos de todas las propuestas (va después de css/tokens.css)
  index.html               — redirige a la home: la carpeta no lista nada
  ag-estudio-bl2j0j/       — una carpeta por propuesta, con su index.html
```

## Privacidad

No hay login. Lo que protege una propuesta es que el link no se puede adivinar:

- La carpeta lleva un sufijo aleatorio de 6 caracteres
  (`python -c "import secrets,string;print(''.join(secrets.choice(string.ascii_lowercase+string.digits) for _ in range(6)))"`).
- Cada página lleva `<meta name="robots" content="noindex, nofollow">`.
- **No** se agregan a `robots.txt` ni se linkean desde ningún lado del sitio.

Quien tenga el link la ve. Para dar de baja una propuesta, se borra la carpeta.

## Armar una nueva desde un PDF

1. Copiar la carpeta de la última propuesta con un slug nuevo.
2. Reemplazar el contenido sección por sección. Cada página del PDF es una
   `<section class="sec">` con su `.sec-head` (`02 / Opciones`) y un `id` para
   el índice de la barra superior.
3. Usar los componentes que ya existen en `propuesta.css` (`.card`, `.g2`/`.g3`,
   `.compare`, `.steps`, `.refs`, `.prices`, `.checks`, `.badge`…). Si hace falta
   uno nuevo, agregarlo ahí y subir el `?v=` en todas las propuestas.
4. Actualizar `<title>`, `og:*` (con la URL absoluta de la carpeta) y el
   mensaje de los links de WhatsApp, que lleva el número de propuesta. El
   número de contacto es **+54 9 11 3007-8640** (`wa.me/5491130078640`). La
   barra superior no linkea a la home.
5. **Vista previa (`og.png`, 1200×630):** captura de una portada armada aparte
   con el título, el cliente y el número de propuesta.
6. **PDF descargable:** se genera desde la misma página, así siempre coincide
   con la web (el `@media print` de `propuesta.css` esconde la barra, los
   botones y el WhatsApp flotante):
   ```bash
   chrome --headless=new --no-pdf-header-footer --virtual-time-budget=4000      --print-to-pdf=propuestas/<slug>/<Cliente>_Propuesta-<N>_ChichaLabs.pdf      http://127.0.0.1:8123/propuestas/<slug>/
   ```
   Los botones "Descargar propuesta" apuntan a ese nombre de archivo.
7. Probar en 390 px de ancho antes de publicar. Push a `main` lo publica.
