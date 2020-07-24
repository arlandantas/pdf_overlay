import puppeteer from 'puppeteer'
 
// Call the async function
printPDF().then(e => console.log(e))

async function printPDF() {
  // Initilize a browser instance
  const browser = await puppeteer.launch({ headless: true });
  // Initialize a new page
  const page_print = await browser.newPage();
  const page = await browser.newPage();
  // Resize that tab
  await page.setViewport({
    width: 800,
    height: 600,
    deviceScaleFactor: 1,
  });

  // URL of the desided print page
  let final_url = 'http://10.10.1.136:81/ipcustos_stopped/Graficos/PorCentro'
  // Get the current url
  let current_url = page.url()
  while (current_url != final_url) {
    // Print current url
    console.log('URL', current_url)
    // If is a new tab
    if (current_url == 'about:blank') {
      // Try navigate to desired page
      await page.goto(final_url, {waitUntil: 'networkidle0'});
    // If it is redirecting the login
    } else if (current_url.endsWith('RedirecionarLogin')) {
      // Just wait...
      await new Promise(resolve => setTimeout(resolve, 200))
    // If it is the login page
    } else if (current_url.endsWith('Login')) {
      // Fill login fields
      await page.type('#usuario', 'admin');
      await page.type('#senha', '@!admin@!');
      // Click the submit button
      await page.click("[ng-click='Login.logar()']")
      // Wait...
      await page.waitForNavigation()
    // If we are at home page
    } else if (current_url.endsWith('ipcustos_stopped/') || current_url.endsWith('ipcustos_stopped')) {
      // Navigate to desired page
      await page.goto(final_url, {waitUntil: 'networkidle0'});
    }
    // Update the current url
    current_url = page.url()
  }
  console.log("Chegamos na página certa!!!", final_url)

  // Wait .5 second to generate the view
  await new Promise(resolve => setTimeout(resolve, 500));
  await page.emulateMediaType('print')
  await page.evaluate(`$("nav").css('display', 'none')`)

  let qtd_centros = await page.$$eval("#tbl_meses tr", trs => trs.length)
  console.log("Total ", qtd_centros)
  for (let i = 1; i <= qtd_centros; i++) {
    // Prepare tab to printing
    await page_print.setContent('<html><body></body></html>')
    await page_print.addStyleTag({ path: './images.css' })

    // Select that centro
    // await page.click(`#tbl_meses tr:nth-child(${i})`)
    await page.evaluate(`$("#tbl_meses tr").eq(${i-1}).click()`)

    // Wait 1 second to generate charts
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Working with on ", await page.title(), ` centro ${i} / ${qtd_centros}`)

    let showing = await page.$$eval('div[ng-controller=GraficoPorCentro] > .col-md-12 > .row', rows => rows.map(r => !r.classList.contains('ng-hide')))
    for (let j in showing) {
      // 13 not running
      j = parseInt(j)
      // console.log(`Chart ${j}: ${showing[j] ? 'show' : 'hidden'}`)
      // if (!showing[j] || ![9].includes(j)) continue
      if (!showing[j]) continue
      if ([0, 2, 5, 4, 10, 11, 12, 14].includes(j)) {
        // Gerado todos os meses do ano
        console.log(`Entered on Chart ${j}`)
        let meses = await page.$$eval(`#slct_mes1${j} option`, options => options
          .filter(o => o.value != '' && !`${o.value}`.startsWith('$'))
          .map(o => ({ id: o.value, ano: o.innerText.split('-')[1], mes: o.innerText.split('-')[0], int_mes: parseInt(o.innerText.split('-')[0]) }))
          .sort((a, b) => a.ano < b.ano ? -1 : 1 )
        )
        let anos = meses.reduce((t, e) => t.includes(e.ano) ? t : [...t, e.ano], [])
        for (let ano of anos) {
          console.log(`Year ${ano}`)
          let meses_ano = meses.reduce((t, e) => !t.includes(e.mes) && e.ano == ano ? [...t, e.mes] : t, [])
          let first_month = meses.find(e => e.ano == ano && e.int_mes == Math.min(...meses_ano)).id
          let last_month = meses.find(e => e.ano == ano && e.int_mes == Math.max(...meses_ano)).id
          await page.select(`#slct_mes1${j}`, first_month)
          await page.select(`#slct_mes2${j}`, last_month)
          // Com mês de referência
          if ([4, 5, 10, 11].includes(j)) {
            await page.select(`#slct_mes3${j}`, last_month)
          }
          // Wait .3 second to fill selects
          await new Promise(resolve => setTimeout(resolve, 300));
          // await page.click(`[ng-click="graficos[${j}].gerar()"]`)
          await page.evaluate(`$('[ng-click="graficos[${j}].gerar()"]').click()`)
          // Wait .5 second to generate chart
          await new Promise(resolve => setTimeout(resolve, 500));

          // let base64 = await screenshotDOMElement(page, `div[ng-controller=GraficoPorCentro] > .col-md-12 > .row:nth-child(${j+1})`, 10)
          let elmt = await page.$(`div[ng-controller=GraficoPorCentro] > .col-md-12 > .row:nth-child(${j+1})`)
          if (!elmt) {
            console.log("undefined")
            continue
          }
          let base64 = await elmt.screenshot({ encoding: 'base64' })
          page_print.evaluate(`
            var div = document.createElement('div')
            var img = document.createElement('img')
            img.src = "data:image/png;base64,${base64}"
            div.appendChild(img)
            document.body.appendChild(div)
          `)
        } 
      } else if ([15].includes(j)) {
        // Gerado todos os meses do ano
        console.log(`Entered on Chart ${j}`)
        let meses = await page.$$eval(`#slct_mes1${j} option`, options => options
          .filter(o => o.value != '' && !`${o.value}`.startsWith('$'))
          .map(o => ({ id: o.value, ano: o.innerText.split('-')[1], mes: o.innerText.split('-')[0], int_mes: parseInt(o.innerText.split('-')[0]) }))
          .sort((a, b) => (parseInt(a.ano) * 12 + a.int_mes) < (parseInt(b.ano) * 12 + b.int_mes) ? -1 : 1 )
        )
        for (let mes of meses) {
          console.log(`Mes ${mes.ano}-${mes.mes}`)
          await page.select(`#slct_mes1${j}`, mes.id)
          // Wait .3 second to fill selects
          await new Promise(resolve => setTimeout(resolve, 300));
          // await page.click(`[ng-click="graficos[${j}].gerar()"]`)
          await page.evaluate(`$('[ng-click="graficos[${j}].gerar()"]').click()`)
          // Wait .5 second to generate chart
          await new Promise(resolve => setTimeout(resolve, 500));

          // let base64 = await screenshotDOMElement(page, `div[ng-controller=GraficoPorCentro] > .col-md-12 > .row:nth-child(${j+1})`, 10)
          let elmt = await page.$(`div[ng-controller=GraficoPorCentro] > .col-md-12 > .row:nth-child(${j+1})`)
          if (!elmt) {
            console.log("undefined")
            continue
          }
          let base64 = await elmt.screenshot({ encoding: 'base64' })
          page_print.evaluate(`
            var div = document.createElement('div')
            var img = document.createElement('img')
            img.src = "data:image/png;base64,${base64}"
            div.appendChild(img)
            document.body.appendChild(div)
          `)
        } 
      } else if ([7, 8].includes(j)) {
        // Gerado a cada 4 meses
        console.log(`Entered on Chart ${j}`)
        let meses = await page.$$eval(`#slct_mes1${j} option`, options => options
          .filter(o => o.value != '' && !`${o.value}`.startsWith('$'))
          .map(o => ({ id: o.value, ano: o.innerText.split('-')[1], mes: o.innerText.split('-')[0], int_mes: parseInt(o.innerText.split('-')[0]) }))
          .sort((a, b) => a.ano < b.ano ? -1 : 1 )
        )
        let anos = meses.reduce((t, e) => t.includes(e.ano) ? t : [...t, e.ano], [])
        for (let ano of anos) {
          console.log(`Year ${ano}`)
          let meses_ano = meses
            .reduce((t, e) => !t.includes(e.int_mes) && e.ano == ano ? [...t, e.int_mes] : t, [])
            .sort((a, b) => a < b ? -1 : 1 )
          let grupos = []
          for (let i_meses = 0; i_meses < meses_ano.length; i_meses+=4) {
            if (i_meses + 4 > meses_ano.length) {
              grupos.push(meses_ano.slice(meses_ano.length-4, meses_ano.length))
            } else {
              grupos.push(meses_ano.slice(i_meses, i_meses+4))
            }
          }
          for (let grupo of grupos) {
            let first_month = meses.find(e => e.ano == ano && e.int_mes == Math.min(...grupo)).id
            let last_month = meses.find(e => e.ano == ano && e.int_mes == Math.max(...grupo)).id
            await page.select(`#slct_mes1${j}`, first_month)
            await page.select(`#slct_mes2${j}`, last_month)
            // Wait .3 second to fill selects
            await new Promise(resolve => setTimeout(resolve, 300));
            // await page.click(`[ng-click="graficos[${j}].gerar()"]`)
            await page.evaluate(`$('[ng-click="graficos[${j}].gerar()"]').click()`)
            // Wait .5 second to generate chart
            await new Promise(resolve => setTimeout(resolve, 500));
  
            // let base64 = await screenshotDOMElement(page, `div[ng-controller=GraficoPorCentro] > .col-md-12 > .row:nth-child(${j+1})`, 10)
            let elmt = await page.$(`div[ng-controller=GraficoPorCentro] > .col-md-12 > .row:nth-child(${j+1})`)
            if (!elmt) {
              console.log("undefined")
              continue
            }
            let base64 = await elmt.screenshot({ encoding: 'base64' })
            page_print.evaluate(`
              var div = document.createElement('div')
              var img = document.createElement('img')
              img.src = "data:image/png;base64,${base64}"
              div.appendChild(img)
              document.body.appendChild(div)
            `)
          }
        }
      } else if ([1, 3, 9].includes(j)) {
        // Gerado de 2 em 2 anos
        console.log(`Entered on Chart ${j}`)
        let anos = await page.$$eval(`#slct_ano1${j} option`, options => options
          .filter(o => o.value != '' && !`${o.value}`.startsWith('?'))
          .map(o => o.innerText )
          .sort((a, b) => a < b ? -1 : 1 )
        )
        let combinacoes = []
        if (anos.length === 0) {
          console.log('there is no years available')
          continue
        } else if (anos.length === 1) {
          console.log('only one year available')
          combinacoes.push([anos[0], anos[0]])
        } else {
          for (let i_ano = 0; i_ano < anos.length-1; i_ano++) {
            combinacoes.push([anos[i_ano], anos[i_ano+1]])
          }
        }
        for (let combinacao of combinacoes) {
          console.log(`Years ${combinacao[0]} & ${combinacao[1]}`)
          await page.select(`#slct_ano1${j}`, `string:${combinacao[0]}`)
          await page.select(`#slct_ano2${j}`, `string:${combinacao[1]}`)
          // Wait .3 second to fill selects
          await new Promise(resolve => setTimeout(resolve, 300));
          // await page.click(`[ng-click="graficos[${j}].gerar()"]`)
          await page.evaluate(`$('[ng-click="graficos[${j}].gerar()"]').click()`)
          // Wait .5 second to generate chart
          await new Promise(resolve => setTimeout(resolve, 500));

          // let base64 = await screenshotDOMElement(page, `div[ng-controller=GraficoPorCentro] > .col-md-12 > .row:nth-child(${j+1})`, 10)
          let elmt = await page.$(`div[ng-controller=GraficoPorCentro] > .col-md-12 > .row:nth-child(${parseInt(j)+1})`)
          // await elmt.screenshot({ path: `C:\\Users\\lanfs\\Desktop\\Impressoes HU\\Graficos/${await page.title()} - ${j} - ${combinacao[0]}-${combinacao[1]}.png` })
          let base64 = await elmt.screenshot({ encoding: 'base64' })
          page_print.evaluate(`
            var div = document.createElement('div')
            var img = document.createElement('img')
            img.src = "data:image/png;base64,${base64}"
            div.appendChild(img)
            document.body.appendChild(div)
          `)
        }
      }
    }

    // Get the current page title
    let name = await page.title()
    // Generate a path where the pdf will be saved
    let file = "C:\\Users\\lanfs\\Desktop\\Impressoes HU\\Graficos/"+name+".pdf"
    // Save the PDF
    await page_print.pdf({ format: 'A4', landscape: false, path: file });
    console.log('Printted ', file)

    if (i == 5)
      break

    // Click at the load button
    // await page.evaluate(`$('button[ng-click="abrir_centro()"]').click()`)
    // await new Promise(resolve => setTimeout(resolve, 1000));
  
    // let qtd_meses = await page.$$eval('#view #tabs li', lis => lis.length)
    // console.log("Count meses", qtd_meses)
    // for (let i = 0; i < qtd_meses; i++) {
    //   // Click at current month tab
    //   await page.evaluate(`$('#view #tabs li:eq(${i})').click()`)
    //   // Wait .5 second to generate the view
    //   await new Promise(resolve => setTimeout(resolve, 500));
  
    //   // Get the current page title
    //   let name = await page.title()
    //   // Generate a path where the pdf will be saved
    //   let file = "C:\\Users\\lanfs\\Desktop\\Impressoes HU\\PEquilibrio/"+name+".pdf"
    //   // Save the PDF
    //   await page.pdf({ format: 'A4', landscape: true, path: file });
    //   console.log('Printted ', file)
    // }
  }
  
  // Close the browser instance
  await browser.close();
  
  return 'All done!!'
}

async function screenshotDOMElement(page, selector, padding = 20, options = {}) {
  const rect = await page.evaluate(selector => {
    const element = document.querySelector(selector);
    const {x, y, width, height} = element.getBoundingClientRect();
    return {left: x, top: y, width, height, id: element.id};
  }, selector);

  console.log("Screenshoting at ", rect)

  return await page.screenshot({
    ...options,
    encoding: 'base64',
    clip: {
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2
    }
  });
}
