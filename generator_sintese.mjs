import puppeteer from 'puppeteer'
 
// Call the async function
printPDF().then(e => console.log(e))

async function printPDF() {
  // Initilize a browser instance
  const browser = await puppeteer.launch({ headless: true });
  // Initialize a new page
  const page = await browser.newPage();

  // URL of the desided print page
  let final_url = 'http://10.10.1.136:81/ipcustos_stopped/Taxas/Sintese'
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

  // Get all options of meses select
  let qtd_meses = await page.$$eval('#tbl_meses tr', trs => trs.length)
  console.log("Count meses", qtd_meses)
  for (let i = 0; i < qtd_meses; i++) {
    // await page.click(`#tbl_meses tr:nth-child(1)`)
    // await page.evaluate(_ => {
    await page.evaluate(`$('#tbl_meses tr').eq(${i}).click()`)
    //   $('#tbl_meses tr').eq(i)
    // });

    // Wait .5 second to generate the table
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the current page title
    let name = await page.title()
    // Generate a path where the pdf will be saved
    let file = "C:\\Users\\lanfs\\Desktop\\Impressoes HU\\Sintese/"+name+".pdf"
    // Save the PDF
    await page.pdf({ format: 'A4', landscape:false, path: file });
    console.log('Printted ', file)
    // If the convenio is not valid
  }
  
  // Close the browser instance
  await browser.close();
  
  return 'All done!!'
}
