import puppeteer from 'puppeteer'
 
// Call the async function
printPDF().then(e => console.log(e))

async function printPDF() {
  // Initilize a browser instance
  const browser = await puppeteer.launch({ headless: true });
  // Initialize a new page
  const page = await browser.newPage();
  // Resize that tab
  await page.setViewport({
    width: 1050,
    height: 650,
    deviceScaleFactor: 1,
  });

  // URL of the desided print page
  let final_url = 'http://10.10.1.136:81/ipcustos_stopped/PEquilibrioCusteio'
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

  // Wait 1 second to generate the view
  await new Promise(resolve => setTimeout(resolve, 1000));

  // await page.select(`select[ng-model="id_centro"]`, '5') // RAD
  // await page.select(`select[ng-model="id_centro"]`, '92') // ECO
  // await page.select(`select[ng-model="id_centro"]`, '72') // END
  // await page.select(`select[ng-model="id_centro"]`, '39') // TOM
  // await page.select(`select[ng-model="id_centro"]`, '38') // ULT

  for (let centro of ['5', '92', '72', '39', '38']) {
    console.log("Working with the centro ", centro)
    // Select that centro
    await page.select(`select[ng-model="id_centro"]`, centro)

    // Click at the load button
    await page.evaluate(`$('button[ng-click="abrir_centro()"]').click()`)
    // Wait 1 second to generate tabs
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    let qtd_meses = await page.$$eval('#view #tabs li', lis => lis.length)
    console.log("Count meses", qtd_meses)
    for (let i = 0; i < qtd_meses; i++) {
      // Click at current month tab
      await page.evaluate(`$('#view #tabs li:eq(${i})').click()`)
      // Wait .5 second to generate the view
      await new Promise(resolve => setTimeout(resolve, 500));
  
      // Get the current page title
      let name = await page.title()
      // Generate a path where the pdf will be saved
      let file = "C:\\Users\\lanfs\\Desktop\\Impressoes HU\\PEquilibrio/"+name+".pdf"
      // Save the PDF
      await page.pdf({ format: 'A4', landscape: true, path: file });
      console.log('Printted ', file)
    }
  }
  
  // Close the browser instance
  await browser.close();
  
  return 'All done!!'
}
