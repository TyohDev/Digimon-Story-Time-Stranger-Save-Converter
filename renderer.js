let inputFolder = null;
let outputFolder = null;
let templateZip = null;

const btnInput = document.getElementById('btn-input');
const btnOutput = document.getElementById('btn-output');
const btnTemplate = document.getElementById('btn-template');
const btnConvert = document.getElementById('btn-convert');
const pathInput = document.getElementById('input-path');
const pathOutput = document.getElementById('output-path');
const pathTemplate = document.getElementById('template-path');
const statusMessage = document.getElementById('status-message');
const templateSection = document.getElementById('template-zip-section');

const radioInputs = document.querySelectorAll('input[name="direction"]');
radioInputs.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'pc-to-switch') {
      templateSection.style.display = 'flex';
    } else {
      templateSection.style.display = 'none';
    }
    checkReady();
  });
});

function checkReady() {
  const direction = document.querySelector('input[name="direction"]:checked').value;
  if (inputFolder && outputFolder) {
    if (direction === 'pc-to-switch' && !templateZip) {
      btnConvert.setAttribute('disabled', 'true');
    } else {
      btnConvert.removeAttribute('disabled');
    }
  } else {
    btnConvert.setAttribute('disabled', 'true');
  }
}

btnInput.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) {
    inputFolder = folder;
    pathInput.textContent = folder;
    pathInput.classList.add('selected');
    checkReady();
  }
});

btnOutput.addEventListener('click', async () => {
  const folder = await window.api.selectFolder();
  if (folder) {
    outputFolder = folder;
    pathOutput.textContent = folder;
    pathOutput.classList.add('selected');
    checkReady();
  }
});

btnTemplate.addEventListener('click', async () => {
  const file = await window.api.selectZip();
  if (file) {
    templateZip = file;
    pathTemplate.textContent = file;
    pathTemplate.classList.add('selected');
    checkReady();
  }
});

btnConvert.addEventListener('click', async () => {
  const direction = document.querySelector('input[name="direction"]:checked').value;
  
  btnConvert.setAttribute('disabled', 'true');
  btnConvert.textContent = 'Converting...';
  statusMessage.textContent = '';
  statusMessage.className = 'status-message';
  
  const result = await window.api.convert({
    inputFolder,
    outputFolder,
    templateZip,
    direction
  });
  
  if (result.success) {
    statusMessage.innerHTML = `Conversion completed successfully! Processed ${result.processed} files.<br><br><span style="color: var(--success-color); font-size: 0.9em">${result.message || ''}</span>`;
    statusMessage.classList.add('success');
  } else {
    statusMessage.textContent = 'Error: ' + result.error;
    statusMessage.classList.add('error');
  }
  
  btnConvert.removeAttribute('disabled');
  btnConvert.textContent = 'Convert Saves';
});
