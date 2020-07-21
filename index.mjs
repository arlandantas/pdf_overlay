import fs from 'fs'

import pdflib from 'pdf-lib'
const { PDFDocument } = pdflib

let cabecalho = 'C:\\Users\\lanfs\\Desktop\\Impressoes HU\\header.pdf'
let conteudo = 'C:\\Users\\lanfs\\Desktop\\Impressoes HU\\Demonstrativos'

overlayFolder(conteudo, cabecalho)

function overlayFolder (folder, overlay) {
  let stats = fs.statSync(folder)
  if (stats.isDirectory()) {
    let files = fs.readdirSync(folder)
    for (let file of files) {
      let stats2 = fs.statSync(conteudo+"\\"+file)
      if (stats2.isFile()) {
        overlayFile(conteudo+"\\"+file, overlay)
      } else {
        console.log("Ignorando: "+conteudo+"\\"+file)
      }
    }
  } else {
    console.error("Diretório inválido! "+folder)
  }
}

async function overlayFile (content, overlay) {
  const pdfDoc = await PDFDocument.create();

  const destination_folder = content.replace(/[\\]/g, '/').split('/').slice(0, -1).join("/")+"/output"
  const file_name = content.replace(/[\\]/g, '/').split('/').slice(-1).join("/")
  fs.mkdirSync(destination_folder, { recursive: true })
  
  // const [americanFlag] = await pdfDoc.embedPdf(flagPdfBytes);
  const headerBytes = fs.readFileSync(overlay)
  const [ headerPage ] = await pdfDoc.embedPdf(headerBytes);
  const headerDims = headerPage.scale(1);
  
  const contentBytes = fs.readFileSync(content)
  const contentPdf = await PDFDocument.load(contentBytes);
  for (let i = 0; i < contentPdf.getPageCount(); i++) {
    const [contentPage] = await pdfDoc.copyPages(contentPdf, [i])
    let page = pdfDoc.addPage(contentPage);

    page.drawPage(headerPage, { ...headerDims, x: 0, y: 0 });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFile(`${destination_folder}/${file_name}`, pdfBytes, (err) => {
    if (err) throw err;
    console.log(`The file has been saved: ${destination_folder}/${file_name}`);
  });
}