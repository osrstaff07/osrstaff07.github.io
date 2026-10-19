const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
  const navDropdowns = Array.from(siteNav.querySelectorAll(".nav-dropdown-group"));

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("is-open", !isOpen);
    if (isOpen) {
      navDropdowns.forEach((dropdown) => {
        dropdown.open = false;
      });
    }
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
      navDropdowns.forEach((dropdown) => {
        dropdown.open = false;
      });
    }
  });

  navDropdowns.forEach((dropdown) => {
    dropdown.addEventListener("toggle", () => {
      if (dropdown.open) {
        navDropdowns.forEach((otherDropdown) => {
          if (otherDropdown !== dropdown) otherDropdown.open = false;
        });
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !siteNav.contains(event.target)) {
      navDropdowns.forEach((dropdown) => {
        dropdown.open = false;
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      navDropdowns.forEach((dropdown) => {
        dropdown.open = false;
      });
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("is-open");
    }
  });
}

document.querySelectorAll("[data-current-year]").forEach((year) => {
  year.textContent = String(new Date().getFullYear());
});

const contactForm = document.querySelector(".contact-form");
if (contactForm instanceof HTMLFormElement) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = contactForm.querySelector(".form-status");
    if (status) {
      status.textContent = "This is a prototype: the form does not send or store messages.";
    }
  });
}

const inventoryGrid = document.querySelector("[data-inventory-grid]");
const cartDialog = document.querySelector("#cart-dialog");
const cartItemsList = document.querySelector("[data-cart-items]");
const cartStatus = document.querySelector("[data-cart-status]");
const cartWarning = document.querySelector("[data-cart-warning]");
const cartCatalog = new Map();

if (inventoryGrid instanceof HTMLElement) {
  inventoryGrid.querySelectorAll(".inventory-card[data-product-id]").forEach((card) => {
    const id = card.dataset.productId;
    const name = card.querySelector("h2")?.textContent?.trim();
    const price = card.dataset.price === "" ? NaN : Number(card.dataset.price);
    if (id && name && Number.isFinite(price) && price >= 0) {
      cartCatalog.set(id, { id, name, price });
    }
  });

  const searchInput = document.querySelector("[data-inventory-search]");
  const sortSelect = document.querySelector("[data-inventory-sort]");
  const resultsCount = document.querySelector("[data-results-count]");
  const emptyMessage = document.querySelector("[data-inventory-empty]");
  const cards = Array.from(inventoryGrid.querySelectorAll(".inventory-card"));
  const startingOrder = new Map(cards.map((card, index) => [card, index]));
  const validCategories = new Set(["all", "pbn", "edu", "casino", "diversification", "expired", "local", "reviews"]);
  const requestedCategory = new URLSearchParams(window.location.search).get("category");
  let selectedCategory = validCategories.has(requestedCategory) ? requestedCategory : "all";

  const updateInventory = () => {
    const searchTerm = searchInput instanceof HTMLInputElement ? searchInput.value.trim().toLowerCase() : "";
    const matchingCards = cards.filter((card) => {
      const categoryMatches = selectedCategory === "all" || card.dataset.category === selectedCategory;
      const searchMatches = !searchTerm || (card.dataset.search || "").toLowerCase().includes(searchTerm);
      return categoryMatches && searchMatches;
    });

    cards.forEach((card) => {
      card.hidden = !matchingCards.includes(card);
    });

    const sortOrder = sortSelect instanceof HTMLSelectElement ? sortSelect.value : "featured";
    matchingCards.sort((left, right) => {
      if (sortOrder === "name") {
        return (left.querySelector("h2")?.textContent || "").localeCompare(right.querySelector("h2")?.textContent || "");
      }
      if (sortOrder === "price-asc" || sortOrder === "price-desc") {
        const leftPrice = left.dataset.price === "" ? NaN : Number(left.dataset.price);
        const rightPrice = right.dataset.price === "" ? NaN : Number(right.dataset.price);
        const leftHasPrice = Number.isFinite(leftPrice);
        const rightHasPrice = Number.isFinite(rightPrice);
        if (!leftHasPrice) return 1;
        if (!rightHasPrice) return -1;
        return sortOrder === "price-asc" ? leftPrice - rightPrice : rightPrice - leftPrice;
      }
      return (startingOrder.get(left) || 0) - (startingOrder.get(right) || 0);
    });
    matchingCards.forEach((card) => inventoryGrid.append(card));

    if (resultsCount) {
      resultsCount.textContent = `${matchingCards.length} ${matchingCards.length === 1 ? "service" : "services"}`;
    }
    if (emptyMessage instanceof HTMLElement) {
      emptyMessage.hidden = matchingCards.length > 0;
    }
  };

  document.querySelectorAll("[data-category-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!(button instanceof HTMLButtonElement)) return;
      selectedCategory = button.dataset.categoryFilter || "all";
      document.querySelectorAll("[data-category-filter]").forEach((filter) => {
        const isSelected = filter === button;
        filter.classList.toggle("is-selected", isSelected);
        filter.setAttribute("aria-pressed", String(isSelected));
      });
      updateInventory();
    });
  });

  if (searchInput instanceof HTMLInputElement) {
    searchInput.addEventListener("input", updateInventory);
  }
  if (sortSelect instanceof HTMLSelectElement) {
    sortSelect.addEventListener("change", updateInventory);
  }

  document.querySelectorAll("[data-filter-count]").forEach((count) => {
    const category = count.getAttribute("data-filter-count");
    const total = cards.filter((card) => category === "all" || card.dataset.category === category).length;
    count.textContent = String(total);
  });

  document.querySelectorAll("[data-category-filter]").forEach((filter) => {
    const isSelected = filter.getAttribute("data-category-filter") === selectedCategory;
    filter.classList.toggle("is-selected", isSelected);
    filter.setAttribute("aria-pressed", String(isSelected));
  });

  updateInventory();
}

if (cartDialog instanceof HTMLDialogElement && cartItemsList instanceof HTMLUListElement) {
  const cart = new Map();
  const cartCountTargets = document.querySelectorAll("[data-cart-count]");
  const cartEmpty = document.querySelector("[data-cart-empty]");
  const subtotal = document.querySelector("[data-cart-subtotal]");

  const showCartWarning = (message) => {
    if (cartWarning instanceof HTMLElement) {
      cartWarning.textContent = message;
      cartWarning.hidden = false;
    }
  };

  try {
    const savedCart = localStorage.getItem("osr-seo-demo-cart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (!Array.isArray(parsedCart)) {
        throw new TypeError("Saved cart must be a list.");
      }
      parsedCart.forEach((entry) => {
        if (
          entry &&
          typeof entry.id === "string" &&
          Number.isInteger(entry.quantity) &&
          entry.quantity > 0 &&
          entry.quantity <= 99 &&
          cartCatalog.has(entry.id)
        ) {
          cart.set(entry.id, entry.quantity);
        }
      });
    }
  } catch {
    showCartWarning("Your saved cart could not be read. You can still use this cart while this page stays open.");
  }

  const formatPrice = (amount) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

  const saveCart = () => {
    try {
      localStorage.setItem("osr-seo-demo-cart", JSON.stringify(
        Array.from(cart, ([id, quantity]) => ({ id, quantity })),
      ));
    } catch {
      showCartWarning("Browser storage is unavailable. Cart changes will be lost when this page closes.");
    }
  };

  const renderCart = () => {
    let itemCount = 0;
    let total = 0;
    cartItemsList.replaceChildren();

    cart.forEach((quantity, id) => {
      const product = cartCatalog.get(id);
      if (!product) return;
      itemCount += quantity;
      total += product.price * quantity;

      const item = document.createElement("li");
      item.className = "cart-item";
      const name = document.createElement("span");
      name.className = "cart-item-name";
      name.textContent = product.name;
      const price = document.createElement("span");
      price.className = "cart-item-price";
      price.textContent = formatPrice(product.price * quantity);

      const controls = document.createElement("div");
      controls.className = "cart-item-controls";
      const decrease = document.createElement("button");
      decrease.type = "button";
      decrease.dataset.cartQuantity = "-1";
      decrease.dataset.productId = id;
      decrease.setAttribute("aria-label", `Decrease quantity of ${product.name}`);
      decrease.textContent = "−";
      const quantityText = document.createElement("span");
      quantityText.textContent = `Qty ${quantity}`;
      const increase = document.createElement("button");
      increase.type = "button";
      increase.dataset.cartQuantity = "1";
      increase.dataset.productId = id;
      increase.setAttribute("aria-label", `Increase quantity of ${product.name}`);
      increase.textContent = "+";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "cart-remove";
      remove.dataset.cartRemove = id;
      remove.textContent = "Remove";

      controls.append(decrease, quantityText, increase, remove);
      item.append(name, price, controls);
      cartItemsList.append(item);
    });

    cartCountTargets.forEach((target) => {
      target.textContent = String(itemCount);
    });
    const cartTrigger = document.querySelector("[data-cart-open]");
    if (cartTrigger instanceof HTMLElement) {
      cartTrigger.setAttribute("aria-label", `Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`);
    }
    if (cartEmpty instanceof HTMLElement) {
      cartEmpty.hidden = itemCount > 0;
    }
    if (subtotal instanceof HTMLElement) {
      subtotal.textContent = formatPrice(total);
    }
  };

  const openCart = () => {
    if (!cartDialog.open) cartDialog.showModal();
  };

  document.querySelectorAll("[data-cart-open]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      openCart();
    });
  });
  document.querySelectorAll("[data-cart-close]").forEach((trigger) => {
    trigger.addEventListener("click", () => cartDialog.close());
  });
  cartDialog.addEventListener("click", (event) => {
    if (event.target === cartDialog) cartDialog.close();
  });

  if (inventoryGrid instanceof HTMLElement) {
    inventoryGrid.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const addButton = event.target.closest("[data-add-to-cart]");
      if (!(addButton instanceof HTMLButtonElement)) return;
      const card = addButton.closest(".inventory-card");
      const id = card?.getAttribute("data-product-id");
      if (!id || !cartCatalog.has(id)) return;
      cart.set(id, Math.min((cart.get(id) || 0) + 1, 99));
      saveCart();
      renderCart();
      if (cartStatus instanceof HTMLElement) {
        cartStatus.textContent = `${cartCatalog.get(id)?.name} added to cart.`;
      }
      openCart();
    });
  }

  cartItemsList.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest("button");
    if (!(target instanceof HTMLButtonElement)) return;
    const id = target.dataset.productId;
    if (id && target.hasAttribute("data-cart-quantity")) {
      const nextQuantity = (cart.get(id) || 0) + Number(target.dataset.cartQuantity);
      if (nextQuantity <= 0) cart.delete(id);
      else cart.set(id, Math.min(nextQuantity, 99));
    }
    const removeId = target.getAttribute("data-cart-remove");
    if (removeId) cart.delete(removeId);
    saveCart();
    renderCart();
  });

  renderCart();
}
