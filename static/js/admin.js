// admin.js
async function setupAdmin() {
  // Загрузка товаров с сервера
  const productsResponse = await fetch('/api/products');
  const products = await productsResponse.json();
  const adminMsg = document.getElementById('admin-msg');

  document.getElementById('scan-order').onclick = () => {
    const readerDiv = document.getElementById('reader');
    readerDiv.classList.remove('hidden');
    adminMsg.textContent = 'Requesting camera access...';

    const html5QrCode = new Html5Qrcode('reader');

    const qrCodeSuccessCallback = async (decodedText, decodedResult) => {
      try {
        adminMsg.textContent = `Processing order ${decodedText}...`;
        await html5QrCode.stop();
        readerDiv.classList.add('hidden');

        // Отметить заказ как полученный
        await fetch(`/api/order/${decodedText}/pickup`, { method: 'POST' });
        
        // Получить информацию о заказе
        const orderResponse = await fetch(`/api/order/${decodedText}`);
        const order = await orderResponse.json();
        
        // Найти товар по ID
        const product = products.find(p => p.id === order.productId);
        
        // Вывести результат
        adminMsg.textContent = 
          product 
            ? `The product has been received: ${product.name}` 
            : `Order ${decodedText} not found`;
            
        // Вывести карточку товара
        const cardDiv = document.getElementById('product-card');
        if (product) {
          cardDiv.innerHTML = `
            <div class="scanned-product-card">
              <img src="/static/resources/product${product.id}.png" alt="${product.name}" class="scanned-product-img">
              <div class="scanned-product-info">
                <div class="scanned-product-title">${product.name}</div>
                ${product.desc ? `<div class='scanned-product-desc'>${product.desc}</div>` : ''}
              </div>
            </div>
          `;
        } else {
          cardDiv.innerHTML = '';
        }
      } catch (error) {
        console.error('Error processing QR code:', error);
        adminMsg.textContent = 'Error processing order.';
      }
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    Html5Qrcode.getCameras().then(cameras => {
      if (cameras && cameras.length) {
        const cameraId = cameras[0].id;
        adminMsg.textContent = 'Starting camera...';
        html5QrCode.start(
            cameraId,
            config,
            qrCodeSuccessCallback,
            (errorMessage) => {
              // parse error, ignore it.
            })
          .catch((err) => {
            console.error(`Unable to start scanning, error: ${err}`);
            adminMsg.textContent = `Unable to start scanning: ${err}`;
          });
      } else {
        console.error('No cameras found.');
        adminMsg.textContent = 'No cameras found on this device.';
      }
    }).catch(err => {
      console.error(`Error getting cameras: ${err}`);
      adminMsg.textContent = `Could not get camera permissions: ${err}`;
    });
  };
}

// Инициализация
window.onload = function() {
  setupAdmin();
  // Карта полетов справа
  if (document.getElementById('flight-map')) {
    var map = L.map('flight-map').setView([56.834717, 60.791897], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    // Кастомные иконки дронов
    var drone1Icon = L.icon({
      iconUrl: '/static/resources/drone1.svg',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24]
    });
    var drone2Icon = L.icon({
      iconUrl: '/static/resources/drone2.svg',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -24]
    });
    // Маркеры дронов
    L.marker([56.835602, 60.792852], {icon: drone1Icon}).addTo(map).bindPopup('Дрон 1');
    L.marker([56.832758, 60.794864], {icon: drone2Icon}).addTo(map).bindPopup('Дрон 2');
  }
};