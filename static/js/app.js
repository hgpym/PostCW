// Данные товаров
const products = [
  { id: 1, name: 'Donuts', img: 'static/resources/product1.png' },
  { id: 2, name: 'Wi-Fi USB Adapter', img: 'static/resources/product2.png' },
  { id: 3, name: 'Arduino Uno Rev3', img: 'static/resources/product3.png' },
  { id: 4, name: 'Club Sandwich with Carbonade', img: 'static/resources/product4.png' },
  { id: 5, name: 'iPhone 16e', img: 'static/resources/product5.png' },
  { id: 6, name: 'Velodyne VLP 16', img: 'static/resources/product6.png' }
];
let selectedProduct = null;
let selectedPoint = null;
let map, marker;

const userIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149071.png', // любая подходящая иконка
  iconSize: [24, 24], // размер
  iconAnchor: [16, 32], // точка "основания" иконки
});

const mapElement = document.getElementById('map');
// После инициализации карты
mapElement.classList.add('visible');


// Инициализация интерфейса
initProducts();
setupRouting();
setupAdmin();

function initProducts() {
  const productsDiv = document.getElementById('products');
  products.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product';
    div.innerHTML = `<img src="${p.img}" alt="${p.name}"><p>${p.name}</p>`;
    div.onclick = () => chooseProduct(p);
    productsDiv.appendChild(div);
  });
}

function chooseProduct(p) {
  selectedProduct = p;
  document.getElementById('map').classList.remove('hidden');
  initMap();
}

function initMap() {
  if (!map) {
    map = L.map('map').setView([56.834717, 60.791897], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

  // В данных точек добавим поле address
const points = [
  {
    coords: [56.834717, 60.791897],
    popup: "Technopark<br>5 Constructorov Street, Yekaterinburg, Sverdlovsk region, 620010",
    address: "st. Constructorov, 5"
  },
  {
    coords: [56.842950, 60.698256],
    popup: "Dom, construction hypermarket<br>Vladimir Vysotsky Street, 50, Yekaterinburg, Sverdlovsk region, 620072",
    address: "st. Vladimira Vysotskogo, 50"
  },
  {
    coords: [56.798093, 60.764444],
    popup: "Latvian street, 54, Yekaterinburg, Sverdlovsk region, 620007",
    address: "st. Latvijskaya, 54"
  }
];

// Обновим функцию создания маркеров
points.forEach(p => {
  const marker = L.marker(p.coords).addTo(map);
  const popupContent = `
    ${p.popup}<br>
    <button onclick="selectPointAndOrder([${p.coords}], '${p.address}')">Place Order</button>
  `;
  marker.bindPopup(popupContent);
});



    map.on('popupopen', function(e) {
  const button = e.popup._contentNode.querySelector('.order-btn');
  if (button) {
    button.addEventListener('click', () => {
      const coords = button.getAttribute('data-coords').split(',').map(Number);
      selectPoint(coords);
      startOrder();  // сразу делает заказ
    });
  }
});


    // === Геолокация пользователя ===
    navigator.geolocation.getCurrentPosition(
  pos => {
    const { latitude, longitude } = pos.coords;
    const userMarker = L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
    userMarker.bindPopup("You are here").openPopup();
  },
  err => {
    console.error("Error getting location:", err.message);
  }
);

  }
}

async function selectPointAndOrder(pt, address) {
  selectedPoint = {
    coords: pt,
    address: address
  };

  // Обновляем информацию сразу при выборе
  document.getElementById('delivery-product').textContent = selectedProduct.name;
  document.getElementById('delivery-point').textContent = address;

  if (!selectedProduct) {
    alert("Please select a product first!");
    return;
  }

  document.getElementById('map').classList.add('hidden');

  document.getElementById('status-text').textContent = 'The order is being processed...';
  document.getElementById('status-section').classList.remove('hidden');

  const res = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      productId: selectedProduct.id,
      address: address
    })
  });

  const { order_id } = await res.json();
  startTimer(order_id);
}


function selectPoint(pt) {
  selectedPoint = pt;
  document.getElementById('order-section').classList.remove('hidden');
}

document.getElementById('start-order').onclick = startOrder;

//function startOrder() {
//  document.getElementById('status-section').classList.remove('hidden');
//  document.getElementById('status-text').textContent = 'Заказ обрабатывается...';
//  startTimer();
//}

async function startOrder() {
  // спрячем кнопку, покажем статус
  document.getElementById('status-text').textContent = 'The order is being processed...';
  document.getElementById('status-section').classList.remove('hidden');

  // 1) создаём заказ на сервере
  const res = await fetch('/api/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: selectedProduct.id })
  });
  const { order_id } = await res.json();
  startTimer(order_id);
}


//function startTimer() {
//  const slider = document.getElementById('slider');
//  const qrDiv = document.getElementById('qrcode');
//  const total = 10;
//  let elapsed = 0;
//
//  slider.max = total;
//  slider.value = 0;
//  slider.disabled = false;
//  qrDiv.innerHTML = '';
//  qrDiv.classList.add('hidden');
//
//  const interval = setInterval(() => {
//    elapsed++;
//    slider.value = elapsed;
//    if (elapsed >= total) {
//      clearInterval(interval);
//      document.getElementById('status-text').textContent = 'Заказ пришёл';
//      qrDiv.classList.remove('hidden');
//      new QRCode(qrDiv, {
//        text: String(selectedProduct.id),
//        width: 128,
//        height: 128
//      });
//    }
//  }, 1000);
//}

function startTimer(orderId) {
  const slider = document.getElementById('slider');
  const qrDiv = document.getElementById('qrcode');
  const total = 5;
  let elapsed = 0;

  // Обновляем информацию о доставке
  document.getElementById('delivery-product').textContent = selectedProduct.name;
  document.getElementById('delivery-point').textContent = selectedPoint.address;

  slider.max = total;
  slider.value = 0;
  slider.disabled = false;
  qrDiv.innerHTML = '';
  qrDiv.classList.add('hidden');

  const interval = setInterval(() => {
    elapsed++;
    slider.value = elapsed;

    if (elapsed === Math.floor(total / 2)) {
      // Через половину времени меняем статус на "Заказ уже летит в постамат..."
      document.getElementById('status-text').textContent = 'The order is already on its way to the post office...';
    }

    if (elapsed >= total) {
    clearInterval(interval);
    document.getElementById('status-text').textContent = 'The order has arrived at the post office! You can pick it up.';
    
    // Показываем QR и информацию
    const qrDiv = document.getElementById('qrcode');
    const infoDiv = document.querySelector('.delivery-info');
    
    qrDiv.classList.remove('hidden');
    infoDiv.classList.remove('hidden');
    
    new QRCode(qrDiv, { 
      text: orderId, 
      width: 128,
      height: 128 
    });

    // Заполняем данные
    document.getElementById('delivery-product').textContent = selectedProduct.name;
    document.getElementById('delivery-point').textContent = selectedPoint.address;
  }
  }, 1000);
}



function setupRouting() {
  window.addEventListener('hashchange', () => {
    const isAdmin = location.hash === '#admin';
    document.getElementById('main-view').classList.toggle('hidden', isAdmin);
    document.getElementById('admin-view').classList.toggle('hidden', !isAdmin);
  });
  window.dispatchEvent(new Event('hashchange'));
}

//function setupAdmin() {
//  document.getElementById('scan-order').onclick = () => {
//    document.getElementById('reader').classList.remove('hidden');
//    const html5Qr = new Html5Qrcode('reader');
//    html5Qr.start(
//      { facingMode: 'environment' },
//      { fps: 10, qrbox: 250 },
//      decoded => {
//        html5Qr.stop();
//        document.getElementById('reader').classList.add('hidden');
//        document.getElementById('admin-msg').textContent = `Товар получен: ${decoded}`;
//      },
//      err => {}
//    ).catch(err => console.error(err));
//  };
//}

function setupAdmin() {
  document.getElementById('scan-order').onclick = () => {
    document.getElementById('reader').classList.remove('hidden');
    const scanner = new Html5QrcodeScanner('reader', { fps:10, qrbox:250 }, false);
    scanner.render(async decoded => {
      // сообщить серверу о получении
      await fetch(`/api/order/${decoded}/pickup`, { method: 'POST' });
      // получить детали заказа
      const res = await fetch(`/api/order/${decoded}`);
      const order = await res.json();
      const product = products.find(p => p.id == order.productId);
      document.getElementById('admin-msg').textContent =
        product
          ? `The product has been received: ${product.name}`
          : `Order ${decoded} accepted`;
      await scanner.clear();
    }, err => {});
  };
}
