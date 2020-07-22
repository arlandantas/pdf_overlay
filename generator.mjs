import puppeteer from 'puppeteer'
 
// Call the async function
printPDF().then(e => console.log(e))

async function printPDF() {
  // Initilize a browser instance
  const browser = await puppeteer.launch({ headless: true });
  // Initialize a new page
  const page = await browser.newPage();

  // URL of the desided print page
  let final_url = 'http://10.10.1.136:81/ipcustos_stopped/AnaliseCentroConvenio'
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
  console.log("Chegamos na página certa!!!")

  // await page.evaluate(_ => {
  //   // this will be executed within the page, that was loaded before
  //   $('select[ng-model="id_centro"]').val('72')
  //   // $('select[ng-model="id_centro"]').val('38')
  //   $('select[ng-model="id_centro"]').trigger('change')
  // });
  
  // Change the centro select value
  await page.select('select[ng-model="id_centro"]', 72)
  // Wait a little
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Get all options of meses select
  let meses = await page.$$eval('select[ng-model=mes_selecionado] option', options => options.map(o => o.value))
  for (let mes of meses) {
    // If it has a valid value
    if (mes != '?') {
      console.log('mes', mes)
      // Select this month at select field
      await page.select('select[ng-model="mes_selecionado"]', mes)
      // Wait a little, while the convenios are loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      // Get all options at convenio select
      let convenios = await page.$$eval('select[ng-model=convenio_selecionado] option', options => options.map(o => o.value))
      for (let convenio of convenios) {
        // If this is a valid convenio
        if (convenio != '? object:null ?') {
          console.log('convenio', convenio)
          // Select this convenio at select field
          await page.select('select[ng-model=convenio_selecionado]', convenio)
          // Wait a little
          await new Promise(resolve => setTimeout(resolve, 500));
          // Click at the button (I have problem with the page.click, so I used the jQuery to execute this click)
          await page.evaluate(_ => {
            $('#bt_abrir').click()
          });
          // Wait 2 seconds to generate the table
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Get the current page title
          let name = await page.title()
          // Generate a path where the pdf will be saved
          let file = "C:\\Users\\lanfs\\Desktop\\Impressoes HU\\Centro x Convenio/"+name+".pdf"
          // Save the PDF
          await page.pdf({ format: 'A4', landscape:true, path: file });
          console.log('Printted ', file)
        // If the convenio is not valid
        } else 
          console.log('convenio invalido', convenio)
      }
    // If the value is invalid
    } else 
      console.log('mes invalido', mes)
  }
  
  // Close the browser instance
  await browser.close();
  
  return 'All done!!'
}
