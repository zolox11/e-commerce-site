// ---------------------------
// script.js - Bestwears Full Functionality
// ---------------------------

// ---------------------------
// UTILITY FUNCTIONS
// ---------------------------
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function loadCart() {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function formatPrice(price) {
    return price.toFixed(2);
}

// ---------------------------
// SHOP PAGE
// ---------------------------
function renderShop(productsToRender) {
    const container = document.querySelector(".products");
    if (!container) return;
    container.innerHTML = "";

    productsToRender.forEach(product => {
        const mainImage = product.colors ? product.colors[0].image : product.image;
        const div = document.createElement("div");
        div.className = "product-item";
        div.innerHTML = `
            <a href="product.html?id=${product.id}" class="product-link">
                <img src="${mainImage}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>$${formatPrice(product.price)}</p>
            </a>
        `;
        container.appendChild(div);
    });

    // View product buttons
    document.querySelectorAll(".view-product").forEach(btn => {
        btn.addEventListener("click", e => {
            const id = e.target.dataset.id;
            window.location.href = `product.html?id=${id}`;
        });
    });
}

function filterProducts() {
    let filtered = [...products];

    const category = document.getElementById("category")?.value;
    const gender = document.getElementById("gender")?.value;
    const minPrice = parseFloat(document.getElementById("priceMin")?.value) || 0;
    const maxPrice = parseFloat(document.getElementById("priceMax")?.value) || Infinity;
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    const colorChecks = Array.from(document.querySelectorAll(".filters input[type=checkbox]:checked")).map(cb => cb.value);

    if (category) filtered = filtered.filter(p => p.category === category);
    if (gender) filtered = filtered.filter(p => p.gender === gender);
    filtered = filtered.filter(p => p.price >= minPrice && p.price <= maxPrice);
    if (searchTerm) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
    if (colorChecks.length > 0) {
        filtered = filtered.filter(p => p.colors?.some(c => colorChecks.includes(c.color)));
    }

    renderShop(filtered);
}

// ---------------------------
// PRODUCT PAGE
// ---------------------------
function renderProductPage() {
    const productId = parseInt(getQueryParam("id"));
    const product = products.find(p => p.id === productId);
    const container = document.querySelector(".product-details");
    if (!product || !container) return;

    const colorOptions = product.colors?.map((c, i) => `
        <button class="color-btn" data-image="${c.image}" ${i === 0 ? "style='border:2px solid black'" : ""}>${c.color}</button>
    `).join("");

    container.innerHTML = `
        <h2>${product.name}</h2>
        <img id="productImage" src="${product.colors[0].image}" alt="${product.name}">
        <p>Price: $${formatPrice(product.price)}</p>
        <div class="product-colors">
            <label>Available Colors:</label>
            ${colorOptions}
        </div>
        <div class="product-sizes">
            <label>Size:</label>
            <select id="productSize">
                ${product.sizes.map(s => `<option value="${s}">${s}</option>`).join("")}
            </select>
        </div>
        <div class="product-quantity">
            <label>Quantity:</label>
            <input type="number" id="productQuantity" value="1" min="1">
        </div>
        <p>Description: ${product.description}</p>
        <button class="add-to-cart">Add to Cart</button>
    `;

    // Color button change image
    document.querySelectorAll(".color-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.getElementById("productImage").src = btn.dataset.image;
            document.querySelectorAll(".color-btn").forEach(b => b.style.border = "none");
            btn.style.border = "2px solid black";
        });
    });

    // Add to cart
    container.querySelector(".add-to-cart").addEventListener("click", () => {
        const selectedColorBtn = container.querySelector(".color-btn[style*='solid']");
        const selectedColor = selectedColorBtn ? selectedColorBtn.textContent : "";
        const size = document.getElementById("productSize").value;
        const quantity = parseInt(document.getElementById("productQuantity").value) || 1;

        const cart = loadCart();
        const existing = cart.find(c => c.id === product.id && c.color === selectedColor && c.size === size);
        if (existing) existing.qty += quantity;
        else cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            color: selectedColor,
            size: size,
            qty: quantity,
            image: document.getElementById("productImage").src
        });
        saveCart(cart);
        alert("Added to cart!");
    });
}

// ---------------------------
// CART PAGE
// ---------------------------
function renderCartPage() {
    const container = document.getElementById("cartItems");
    if (!container) return;

    const cart = loadCart(); // Load cart from localStorage
    container.innerHTML = "";

    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.name}${item.color ? " ("+item.color+")" : ""} (${item.size})</td>
            <td>$${item.price.toFixed(2)}</td>
            <td><input type="number" min="1" value="${item.qty}" data-index="${index}" class="cart-qty"></td>
            <td>$${itemTotal.toFixed(2)}</td>
            <td><button data-index="${index}" class="remove-item">X</button></td>
        `;
        container.appendChild(row);
    });

    // Update total in cart summary
    document.getElementById("cartTotal").textContent = total.toFixed(2);

    // Handle remove item
    document.querySelectorAll(".remove-item").forEach(btn => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.index);
            cart.splice(index, 1); // Remove from array
            saveCart(cart); // Save updated cart
            renderCartPage(); // Re-render cart
        });
    });

    // Handle quantity change
    document.querySelectorAll(".cart-qty").forEach(input => {
        input.addEventListener("change", () => {
            let qty = parseInt(input.value);
            if (qty < 1) qty = 1; // Prevent zero or negative
            cart[parseInt(input.dataset.index)].qty = qty;
            saveCart(cart);
            renderCartPage();
        });
    });
}

// ---------------------------
// CHECKOUT PAGE
// ---------------------------
function renderCheckoutPage() {
    const container = document.getElementById("orderSummary");
    if (!container) return;

    const cart = loadCart();
    container.innerHTML = "";

    let total = 0;
    cart.forEach(item => {
        const row = document.createElement("tr");
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        row.innerHTML = `
            <td>${item.name}${item.color ? " ("+item.color+")" : ""} (${item.size})</td>
            <td>$${formatPrice(item.price)}</td>
            <td>${item.qty}</td>
            <td>$${formatPrice(itemTotal)}</td>
        `;
        container.appendChild(row);
    });

    document.getElementById("orderTotal").textContent = formatPrice(total);

    const form = document.getElementById("checkoutForm");
    form?.addEventListener("submit", e => {
        e.preventDefault();
        if(cart.length===0){
            alert("Cart is empty!");
            return;
        }
        alert("Order placed! Thank you for shopping at Bestwears.");
        localStorage.removeItem("cart");
        window.location.href = "index.html";
    });
}

// ---------------------------
// INITIALIZATION
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".products")) {
        renderShop(products);

        document.getElementById("searchButton")?.addEventListener("click", filterProducts);
        document.getElementById("searchInput")?.addEventListener("keypress", e => {
            if(e.key==="Enter") filterProducts();
        });

        ["category","gender","priceMin","priceMax"].forEach(id => {
            document.getElementById(id)?.addEventListener("change", filterProducts);
        });

        document.querySelectorAll(".filters input[type=checkbox]").forEach(cb => cb.addEventListener("change", filterProducts));
    }

    if (document.querySelector(".product-details")) renderProductPage();
    if (document.getElementById("cartItems")) renderCartPage();
    if (document.getElementById("orderSummary")) renderCheckoutPage();
});