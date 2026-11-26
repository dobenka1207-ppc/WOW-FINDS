const defaultProducts = [
	{
		name: "Smart Watch",
		image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
		link: "https://amazon.com"
	},
	{
		name: "Modern Lamp",
		image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600",
		link: "https://amazon.com"
	}
];

let products = JSON.parse(localStorage.getItem("wowProducts")) || defaultProducts;

function saveProducts() {
	localStorage.setItem("wowProducts", JSON.stringify(products));
}

function safe(value) {
	return String(value).replace(/[&<>"']/g, char => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;"
	}[char]));
}

function renderProducts() {
	const container = document.getElementById("products");
	if (!container) return;

	container.innerHTML = products.map((p, index) => `
		<div class="product">
			<img src="${safe(p.image)}" alt="${safe(p.name)}">
			<h3>${safe(p.name)}</h3>
			<a href="${safe(p.link)}" target="_blank" rel="noopener noreferrer" class="buy-button">
				BUY NOW ↗
			</a>
			<button class="delete-product" data-index="${index}">
				DELETE
			</button>
		</div>
	`).join("");
}

document.addEventListener("click", function(event) {
	const deleteButton = event.target.closest(".delete-product");

	if (deleteButton) {
		const index = Number(deleteButton.dataset.index);

		if (confirm("Видалити цей товар?")) {
			products.splice(index, 1);
			saveProducts();
			renderProducts();
		}
	}
});

const style = document.createElement("style");
style.textContent = `
	.delete-product {
		display: block;
		width: 100%;
		margin-top: 10px;
		padding: 12px;
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: bold;
	}
	.delete-product:hover {
		background: #b02a37;
	}
`;
document.head.appendChild(style);

// Панель додавання товарів
const adminButton = document.createElement("button");
adminButton.textContent = "＋ Додати товар";
adminButton.style.cssText = `
	position:fixed;bottom:20px;right:20px;z-index:9999;
	padding:15px 22px;background:#222;color:white;
	border:0;border-radius:8px;cursor:pointer;font-size:16px;
`;
document.body.appendChild(adminButton);

const modal = document.createElement("div");
modal.style.cssText = `
	display:none;position:fixed;inset:0;background:#0009;
	z-index:10000;justify-content:center;align-items:center;padding:20px;
`;

modal.innerHTML = `
	<div style="background:white;padding:25px;border-radius:12px;width:100%;max-width:400px;color:#222;">
		<h2>Додати товар</h2>
		<form id="productForm">
			<input id="productName" placeholder="Назва товару" required
				style="width:100%;padding:12px;margin:8px 0;box-sizing:border-box;">
			<input id="productImage" placeholder="Посилання на фото (https://...)" required
				style="width:100%;padding:12px;margin:8px 0;box-sizing:border-box;">
			<input id="productLink" placeholder="Партнерське посилання (https://...)" required
				style="width:100%;padding:12px;margin:8px 0;box-sizing:border-box;">
			<button type="submit" style="padding:12px;width:100%;background:#222;color:white;border:0;cursor:pointer;">
				ДОДАТИ
			</button>
			<button type="button" id="closeModal" style="padding:12px;width:100%;margin-top:8px;cursor:pointer;">
				ЗАКРИТИ
			</button>
		</form>
	</div>
`;

document.body.appendChild(modal);

adminButton.addEventListener("click", () => {
	modal.style.display = "flex";
});

document.getElementById("closeModal").addEventListener("click", () => {
	modal.style.display = "none";
});

document.getElementById("productForm").addEventListener("submit", function(event) {
	event.preventDefault();

	const name = document.getElementById("productName").value.trim();
	const image = document.getElementById("productImage").value.trim();
	const link = document.getElementById("productLink").value.trim();

	if (!image.startsWith("https://") || !link.startsWith("https://")) {
		alert("Посилання повинні починатися з https://");
		return;
	}

	products.push({ name, image, link });
	saveProducts();
	renderProducts();

	this.reset();
	modal.style.display = "none";
});

renderProducts();
