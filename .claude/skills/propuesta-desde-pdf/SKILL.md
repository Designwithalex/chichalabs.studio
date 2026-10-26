---
name: propuesta-desde-pdf
description: Convierte un PDF de propuesta/presupuesto de ChichaLabs en una página HTML responsive publicada en chichalabs.studio/propuestas/<cliente>-<código>/. Usar cuando Ale pasa un PDF de propuesta y pide subirla, pasarla a web o tener un link para el cliente.
---

1. Leer el PDF completo (texto e imágenes de cada página).
2. Seguir `propuestas/README.md`: carpeta nueva con sufijo aleatorio, copiar la
   última propuesta como base y reemplazar el contenido. Respetar el texto del
   PDF tal cual; no inventar ni resumir.
3. Verificar en 390 px y 1280 px con
   `npx -y playwright@1.48.0 screenshot -b cr --channel chrome --viewport-size=390,844 --full-page <url> <archivo>`
   sirviendo el repo con `php -S 127.0.0.1:8123 -t .`.
4. Commit y push a `main` (publica por FTP en ~1 min). Dar el link final.
