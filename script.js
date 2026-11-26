
const SUPABASE_URL = "https://hampvnfbxsekknkeibna.supabase.co";
const SUPABASE_KEY = "sb_publishable_KCEnHLwdwj_f-E2iUCsbTA_Mi_t7Z4k";

let db;
let currentUser = null;
let isAdmin = false;

const safe = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;",
  '"': "&quot;", "'": "&#39;"
}[c]));

function addStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #wowAdminButton {
      position: fixed;
      bottom: 22px;
      right: 22px;
      z-index: 999;
      background: #ff7900;
      color: #101010;
      border: 0;
      padding: 13px 22px;
      border-radius: 7px;
      font-weight: 900;
      cursor: pointer;
    }

    #wowModal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 10000;
      background: #000d;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    #wowPanel {
      background: #202020;
      color: white;
      padding: 25px;
      border: 1px solid #ff7900;
      border-radius: 12px;
      width: 100%;
      max-width: 420px;
      max-height: 90vh;
      overflow: auto;
    }

    #wowPanel input {
      width: 100%;
      padding: 13px;
      margin: 8px 0;
      box-sizing: border-box;
      background: #111;
      color: white;
      border: 1px solid #555;
      border-radius: 5px;
    }

    #wowPanel button {
      width: 100%;
      padding: 13px;
      margin-top: 9px;
      border: 0;
      border-radius: 5px;
      cursor: pointer;
      font-weight: bold;
    }

    .wowMainButton {
      background: #ff7900;
      color: #111;
    }

    .wowCloseButton {
      background: #444;
      color: white;
    }

    .wowDeleteButton {
      background: #dc3545;
      color: white;
    }

    .wowError {
      color: #ff7777;
      margin-top: 10px;
    }

    .wowProductActions {
      margin-top: 10px;
    }
  `;
  document.head.appendChild(style);
}

function createAdminInterface() {
  const button = document.createElement("button");
  button.id = "wowAdminButton";
  button.textContent = "ADMIN";
  document.body.appendChild(button);

  const modal = document.createElement("div");
  modal.id = "wowModal";
  modal.innerHTML = `<div id="wowPanel"></div>`;
  document.body.appendChild(modal);

  button.addEventListener("click", showAdminPanel);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
}

function showAdminPanel() {
  const panel = document.getElementById("wowPanel");

  if (!currentUser || !isAdmin) {
    panel.innerHTML = `
      <h2>Admin Login</h2>
      <form id="wowLoginForm">
        <input id="wowEmail" type="email" placeholder="Email" required>
        <input id="wowPassword" type="password" placeholder="Password" required>
        <button class="wowMainButton">LOG IN</button>
      </form>
      <p id="wowMessage" class="wowError"></p>
      <button class="wowCloseButton" id="wowClose">CLOSE</button>
    `;
  } else {
    panel.innerHTML = `
      <h2>WOW Finds Admin</h2>
      <form id="wowProductForm">
        <input id="wowName" placeholder="Product name" required>
        <input id="wowImage" type="url" placeholder="Photo URL (https://...)" required>
        <input id="wowLink" type="url" placeholder="Affiliate link (https://...)" required>
        <button class="wowMainButton">ADD PRODUCT</button>
      </form>
      <p id="wowMessage"></p>
      <button class="wowCloseButton" id="wowLogout">LOG OUT</button>
      <button class="wowCloseButton" id="wowClose">CLOSE</button>
    `;
  }

  document.getElementById("wowModal").style.display = "flex";

  document.getElementById("wowClose").onclick = () => {
    document.getElementById("wowModal").style.display = "none";
  };

  const loginForm = document.getElementById("wowLoginForm");

  if (loginForm) {
    loginForm.onsubmit = async event => {
      event.preventDefault();

      const message = document.getElementById("wowMessage");
      message.textContent = "Logging in...";

      const { data, error } = await db.auth.signInWithPassword({
        email: document.getElementById("wowEmail").value.trim(),
        password: document.getElementById("wowPassword").value
      });

      if (error) {
        message.textContent = error.message;
        return;
      }

      currentUser = data.user;
      await checkAdmin();

      if (isAdmin) {
        showAdminPanel();
      } else {
        message.textContent = "This account is not an administrator.";
        await db.auth.signOut();
        currentUser = null;
      }
    };
  }

  const productForm = document.getElementById("wowProductForm");

  if (productForm) {
    productForm.onsubmit = async event => {
      event.preventDefault();

      const name = document.getElementById("wowName").value.trim();
      const image_url = document.getElementById("wowImage").value.trim();
      const affiliate_url = document.getElementById("wowLink").value.trim();
      const message = document.getElementById("wowMessage");

      if (!image_url.startsWith("https://") ||
          !affiliate_url.startsWith("https://")) {
        message.textContent = "Links must start with https://";
        return;
      }

      message.textContent = "Saving...";

      const { error } = await db.from("products").insert({
        name,
        image_url,
        affiliate_url
      });

      if (error) {
        message.textContent = error.message;
        return;
      }

      productForm.reset();
      message.textContent = "Product added!";
      await loadProducts();
    };
  }

  const logout = document.getElementById("wowLogout");

  if (logout) {
    logout.onclick = async () => {
      await db.auth.signOut();
      currentUser = null;
      isAdmin = false;
      showAdminPanel();
      await loadProducts();
    };
  }
}

async function checkAdmin() {
  isAdmin = false;
  if (!currentUser) return;

  const { data, error } = await db
    .from("admin_users")
    .select("user_id")
    .eq("user_id", currentUser.id)
    .maybeSingle();

  isAdmin = !error && !!data;
}

async function loadProducts() {
  const container = document.getElementById("products");
  if (!container) return;

  container.innerHTML = "<p>Loading products...</p>";

  const { data, error } = await db
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = "<p>Could not load products.</p>";
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p>No products yet. Check back soon!</p>";
    return;
  }

  container.innerHTML = data.map(product => `
    <div class="product">
      <img
        src="${safe(product.image_url)}"
        alt="${safe(product.name)}"
        loading="lazy"
      >
      <h3>${safe(product.name)}</h3>
      <a
        href="${safe(product.affiliate_url)}"
        target="_blank"
        rel="noopener noreferrer"
        class="buy-button"
      >DISCOVER PRODUCT ↗</a>

      ${isAdmin ? `
        <div class="wowProductActions">
          <button
            class="wowDeleteButton"
            data-delete="${safe(product.id)}"
          >DELETE</button>
        </div>
      ` : ""}
    </div>
  `).join("");
}

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-delete]");
  if (!button || !isAdmin) return;

  if (!confirm("Delete this product?")) return;

  const { error } = await db
    .from("products")
    .delete()
    .eq("id", button.dataset.delete);

  if (error) {
    alert(error.message);
    return;
  }

  await loadProducts();
});

async function start() {
  addStyles();
  createAdminInterface();

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  script.onload = async () => {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data } = await db.auth.getSession();
    currentUser = data.session?.user || null;

    await checkAdmin();
    await loadProducts();

    db.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      await checkAdmin();
      await loadProducts();
    });
  };

  script.onerror = () => {
    const container = document.getElementById("products");
    if (container) {
      container.innerHTML = "<p>Could not connect to Supabase.</p>";
    }
  };

  document.head.appendChild(script);
}

start();
