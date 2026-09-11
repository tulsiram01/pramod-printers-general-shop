const cfg = window.SUPABASE_CONFIG || {};

let sb = null;
let editingId = "";
let allDesigns = [];
let selectedGalleryCategory = "all";

const $ = (id) => document.getElementById(id);

/* ===============================
   Supabase Configuration
================================ */

function configured() {
  return (
    cfg.url &&
    cfg.anonKey &&
    !cfg.url.includes("YOUR_") &&
    !cfg.anonKey.includes("YOUR_")
  );
}

/* ===============================
   HTML Escape
================================ */

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>'"]/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[char],
  );
}

/* ===============================
   Messages
================================ */

function showMsg(text, type = "success") {
  const box = $("appMsg");

  if (!box) return;

  box.innerHTML = `
    <div class="msg ${type}">
      ${escapeHtml(text)}
    </div>
  `;
}

function loginMsg(text, type = "error") {
  const box = $("loginMsg");

  if (!box) return;

  box.innerHTML = `
    <div class="msg ${type}">
      ${escapeHtml(text)}
    </div>
  `;
}

/* ===============================
   Google Drive Image URL
================================ */

function driveImageUrl(value) {
  const rawUrl = String(value || "").trim();

  if (!rawUrl) return "";

  let fileId = "";
  let match;

  // https://drive.google.com/file/d/FILE_ID/view
  match = rawUrl.match(
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i,
  );

  if (match) {
    fileId = match[1];
  }

  // https://drive.google.com/open?id=FILE_ID
  // https://drive.google.com/uc?id=FILE_ID
  // https://drive.google.com/thumbnail?id=FILE_ID
  if (!fileId) {
    match = rawUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/i);

    if (match) {
      fileId = match[1];
    }
  }

  // /d/FILE_ID/
  if (!fileId) {
    match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/i);

    if (match) {
      fileId = match[1];
    }
  }

  // Direct Google Drive File ID
  if (!fileId && /^[a-zA-Z0-9_-]{15,}$/.test(rawUrl)) {
    fileId = rawUrl;
  }

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }

  return rawUrl;
}

/* ===============================
   Category Mapping
================================ */

const CATEGORY_DATA = {
  "शादी कार्ड": {
    title: "शुभ विवाह निमंत्रण कार्ड",
    description:
      "शादी समारोह के लिए सुंदर, आकर्षक और प्रीमियम विवाह निमंत्रण कार्ड डिजाइन।",
  },

  "भागवत": {
    title: "श्रीमद् भागवत कथा निमंत्रण कार्ड",
    description:
      "श्रीमद् भागवत कथा एवं धार्मिक आयोजन के लिए सुंदर और आकर्षक निमंत्रण कार्ड डिजाइन।",
  },

  "जन्मदिन": {
    title: "जन्मदिन निमंत्रण कार्ड",
    description:
      "जन्मदिन समारोह के लिए रंगीन, आकर्षक और खूबसूरत जन्मदिन निमंत्रण कार्ड डिजाइन।",
  },

  "गृह प्रवेश": {
    title: "गृह प्रवेश निमंत्रण कार्ड",
    description:
      "गृह प्रवेश समारोह के लिए शुभ, पारंपरिक और सुंदर निमंत्रण कार्ड डिजाइन।",
  },

  "अन्य": {
    title: "सुंदर एवं आकर्षक डिजाइन",
    description:
      "आपकी आवश्यकता के अनुसार सुंदर, आकर्षक और प्रीमियम डिजाइन।",
  },

  /* पुराने English category values की compatibility */

  wedding: {
    title: "शुभ विवाह निमंत्रण कार्ड",
    description:
      "शादी समारोह के लिए सुंदर, आकर्षक और प्रीमियम विवाह निमंत्रण कार्ड डिजाइन।",
  },

  birthday: {
    title: "जन्मदिन निमंत्रण कार्ड",
    description:
      "जन्मदिन समारोह के लिए रंगीन, आकर्षक और खूबसूरत जन्मदिन निमंत्रण कार्ड डिजाइन।",
  },

  housewarming: {
    title: "गृह प्रवेश निमंत्रण कार्ड",
    description:
      "गृह प्रवेश समारोह के लिए शुभ, पारंपरिक और सुंदर निमंत्रण कार्ड डिजाइन।",
  },

  other: {
    title: "सुंदर एवं आकर्षक डिजाइन",
    description:
      "आपकी आवश्यकता के अनुसार सुंदर, आकर्षक और प्रीमियम डिजाइन।",
  },
};

function normalizeCategory(category) {
  const value = String(category || "").trim();

  const oldCategoryMap = {
    wedding: "शादी कार्ड",
    birthday: "जन्मदिन",
    housewarming: "गृह प्रवेश",
    other: "अन्य",
  };

  return oldCategoryMap[value] || value || "अन्य";
}

function getCategoryTitle(category) {
  const normalizedCategory = normalizeCategory(category);

  return (
    CATEGORY_DATA[normalizedCategory]?.title ||
    CATEGORY_DATA["अन्य"].title
  );
}

function getCategoryDescription(category, title = "") {
  const normalizedCategory = normalizeCategory(category);

  const description =
    CATEGORY_DATA[normalizedCategory]?.description ||
    CATEGORY_DATA["अन्य"].description;

  return title ? `${title} - ${description}` : description;
}

/* ===============================
   Automatic Title & Description
================================ */

function updateAutoFields() {
  const category = $("category")?.value || "अन्य";
  const title = getCategoryTitle(category);
  const description = getCategoryDescription(category, title);

  if ($("title")) {
    $("title").value = title;
  }

  if ($("description")) {
    $("description").value = description;
  }
}

$("category")?.addEventListener("change", updateAutoFields);

/* ===============================
   Image Preview
================================ */

function preview() {
  const rawUrl = $("imageUrl")?.value.trim() || "";
  const previewUrl = driveImageUrl(rawUrl);

  const previewBox = document.querySelector(".url-preview");
  const previewImage = $("imagePreview");

  if (!previewBox || !previewImage) return;

  previewBox.classList.remove("has-image", "has-error");

  const oldError = previewBox.querySelector(".preview-error");

  if (oldError) {
    oldError.remove();
  }

  if (!rawUrl) {
    previewImage.removeAttribute("src");
    return;
  }

  previewImage.onload = () => {
    previewBox.classList.add("has-image");
  };

  previewImage.onerror = () => {
    previewBox.classList.add("has-error");

    const error = document.createElement("div");

    error.className = "preview-error";
    error.textContent =
      "Image load नहीं हुई। Google Drive में Anyone with the link → Viewer करें।";

    previewBox.appendChild(error);
  };

  previewImage.src = previewUrl;
}

/* ===============================
   Reset Form
================================ */

function resetForm() {
  $("designForm")?.reset();

  if ($("designId")) {
    $("designId").value = "";
  }

  if ($("published")) {
    $("published").checked = true;
  }

  editingId = "";

  if ($("formTitle")) {
    $("formTitle").textContent = "नया Design जोड़ें";
  }

  if ($("saveBtn")) {
    $("saveBtn").textContent = "Design Save करें";
  }

  const previewBox = document.querySelector(".url-preview");
  const previewImage = $("imagePreview");

  if (previewBox) {
    previewBox.classList.remove("has-image", "has-error");

    const error = previewBox.querySelector(".preview-error");

    if (error) {
      error.remove();
    }
  }

  if (previewImage) {
    previewImage.removeAttribute("src");
  }

  if ($("category")) {
    if (!$("category").value) {
      $("category").value = "अन्य";
    }

    updateAutoFields();
  }
}

/* ===============================
   Show App
================================ */

function showApp() {
  $("loginPanel")?.classList.add("hidden");
  $("appPanel")?.classList.remove("hidden");

  loadDesigns();
}

/* ===============================
   Initialize Supabase
================================ */

async function init() {
  if (!configured()) {
    loginMsg(
      "supabase-config.js में Project URL और Publishable Key जांचें।",
    );
    return;
  }

  if (!window.supabase) {
    loginMsg("Supabase library load नहीं हुई।");
    return;
  }

  sb = window.supabase.createClient(cfg.url, cfg.anonKey);

  const { data, error } = await sb.auth.getSession();

  if (error) {
    loginMsg(error.message);
    return;
  }

  if (data?.session) {
    showApp();
  }
}

/* ===============================
   Login
================================ */

$("loginForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!sb) {
    loginMsg("Supabase अभी configure नहीं है।");
    return;
  }

  const email = $("loginEmail")?.value.trim() || "";
  const password = $("loginPassword")?.value || "";

  if (!email || !password) {
    loginMsg("Email और Password भरें।");
    return;
  }

  const { error } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    loginMsg(error.message);
  } else {
    showApp();
  }
});

/* ===============================
   Logout
================================ */

async function logout() {
  if (sb) {
    await sb.auth.signOut();
  }

  location.reload();
}

$("logoutBtn")?.addEventListener("click", logout);
$("mobileLogout")?.addEventListener("click", logout);

/* ===============================
   Form Controls
================================ */

$("cancelBtn")?.addEventListener("click", resetForm);
$("resetBtn")?.addEventListener("click", resetForm);
$("imageUrl")?.addEventListener("input", preview);

$("newDesignBtn")?.addEventListener("click", () => {
  resetForm();

  $("formPanel")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  $("title")?.focus();
});

$("menuBtn")?.addEventListener("click", () => {
  document.querySelector(".sidebar")?.classList.toggle("open");
});

/* ===============================
   Admin Search & Category Filter
================================ */

$("searchInput")?.addEventListener("input", renderDesigns);
$("categoryFilter")?.addEventListener("change", renderDesigns);
$("filterCategory")?.addEventListener("change", renderDesigns);

/* ===============================
   Save / Update Design
================================ */

$("designForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!sb) {
    showMsg("Supabase connection उपलब्ध नहीं है।", "error");
    return;
  }

  const category = normalizeCategory(
    $("category")?.value || "अन्य",
  );

  const title = getCategoryTitle(category);
  const description = getCategoryDescription(category, title);

  const is_published = $("published")?.checked ?? true;

  const originalImageUrl =
    $("imageUrl")?.value.trim() || "";

  const image_url = driveImageUrl(originalImageUrl);
  const id = $("designId")?.value || "";

  if (!originalImageUrl) {
    showMsg("Google Drive Image URL भरना जरूरी है।", "error");

    $("imageUrl")?.focus();

    return;
  }

  const saveButton = $("saveBtn");

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = id ? "Updating..." : "Saving...";
  }

  try {
    const payload = {
      title,
      category,
      description,
      image_url,
      is_published,
    };

    let result;

    if (id) {
      result = await sb
        .from("designs")
        .update(payload)
        .eq("id", id);
    } else {
      result = await sb
        .from("designs")
        .insert([payload]);
    }

    if (result.error) {
      throw result.error;
    }

    showMsg(
      id
        ? "Design सफलतापूर्वक update हो गया।"
        : "Design सफलतापूर्वक save हो गया।",
    );

    resetForm();

    await loadDesigns();
  } catch (error) {
    showMsg(
      error.message || "Design save करते समय समस्या हुई।",
      "error",
    );
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = "Design Save करें";
    }
  }
});

/* ===============================
   Load Designs
================================ */

async function loadDesigns() {
  if (!sb) return;

  const { data, error } = await sb
    .from("designs")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    showMsg(error.message, "error");
    return;
  }

  allDesigns = data || [];

  updateCounts();
  renderDesigns();
  renderGalleryDesigns();
}

/* ===============================
   Update Counts
================================ */

function updateCounts() {
  if ($("totalCount")) {
    $("totalCount").textContent = allDesigns.length;
  }

  if ($("publishedCount")) {
    $("publishedCount").textContent = allDesigns.filter(
      (design) => design.is_published,
    ).length;
  }

  if ($("hiddenCount")) {
    $("hiddenCount").textContent = allDesigns.filter(
      (design) => !design.is_published,
    ).length;
  }
}

/* ===============================
   Render Admin Table
================================ */

function renderDesigns() {
  const rows = $("designRows");

  if (!rows) return;

  const searchTerm =
    $("searchInput")?.value.toLowerCase().trim() || "";

  const categoryFilter =
    $("categoryFilter") || $("filterCategory");

  const selectedCategory =
    categoryFilter?.value.trim() || "all";

  const filteredDesigns = allDesigns.filter((design) => {
    const title = String(design.title || "").toLowerCase();
    const category = String(
      normalizeCategory(design.category || ""),
    ).toLowerCase();

    const description = String(
      design.description || "",
    ).toLowerCase();

    const matchesSearch =
      !searchTerm ||
      title.includes(searchTerm) ||
      category.includes(searchTerm) ||
      description.includes(searchTerm);

    const normalizedSelectedCategory =
      normalizeCategory(selectedCategory);

    const matchesCategory =
      selectedCategory === "all" ||
      normalizeCategory(design.category) ===
        normalizedSelectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (filteredDesigns.length === 0) {
    rows.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          इस Category में कोई design नहीं मिला।
        </td>
      </tr>
    `;

    return;
  }

  rows.innerHTML = filteredDesigns
    .map((design) => {
      const imageUrl = escapeHtml(
        driveImageUrl(design.image_url),
      );

      const category = normalizeCategory(design.category);

      return `
        <tr>
          <td>
            <img
              class="table-image"
              src="${imageUrl}"
              alt="${escapeHtml(design.title || "")}"
              loading="lazy"
              onerror="
                this.onerror=null;
                this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23eeeeee%22/%3E%3Ctext x=%2250%22 y=%2255%22 font-size=%2212%22 text-anchor=%22middle%22 fill=%22%23666666%22%3ENo Image%3C/text%3E%3C/svg%3E';
              "
            >
          </td>

          <td>
            <strong>
              ${escapeHtml(
                design.title || getCategoryTitle(category),
              )}
            </strong>

            <small>
              ${escapeHtml(
                design.description ||
                  getCategoryDescription(category),
              )}
            </small>
          </td>

          <td>
            ${escapeHtml(category)}
          </td>

          <td>
            <span class="status ${
              design.is_published
                ? "published"
                : "hidden-status"
            }">
              ${
                design.is_published
                  ? "Published"
                  : "Hidden"
              }
            </span>
          </td>

          <td class="actions">
            <button
              class="btn btn-light btn-mini"
              onclick="editDesign('${design.id}')"
            >
              Edit
            </button>

            <button
              class="btn btn-danger btn-mini"
              onclick="deleteDesign('${design.id}')"
            >
              Delete
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

/* ===============================
   Gallery Category Buttons
================================ */

function initGalleryFilters() {
  const filterButtons =
    document.querySelectorAll(".filter-btn");

  if (!filterButtons.length) return;

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      selectedGalleryCategory =
        button.dataset.filter || "all";

      renderGalleryDesigns();
    });
  });
}

/* ===============================
   Gallery Container
================================ */

function getGalleryContainer() {
  return (
    document.querySelector(".design-gallery") ||
    document.querySelector("#designGallery") ||
    document.querySelector("[data-design-gallery]")
  );
}

/* ===============================
   Render Public Gallery
================================ */

function renderGalleryDesigns() {
  const gallery = getGalleryContainer();

  if (!gallery) return;

  const filteredDesigns = allDesigns.filter((design) => {
    const category = normalizeCategory(design.category);

    const matchesCategory =
      selectedGalleryCategory === "all" ||
      category === selectedGalleryCategory;

    return design.is_published && matchesCategory;
  });

  if (!filteredDesigns.length) {
    gallery.innerHTML = `
      <div class="empty-gallery">
        इस Category में अभी कोई design उपलब्ध नहीं है।
      </div>
    `;

    return;
  }

  gallery.innerHTML = filteredDesigns
    .map((design) => {
      const imageUrl = escapeHtml(
        driveImageUrl(design.image_url),
      );

      const title = escapeHtml(
        design.title ||
          getCategoryTitle(design.category),
      );

      const description = escapeHtml(
        design.description ||
          getCategoryDescription(design.category),
      );

      return `
        <div class="design-card">
          <div class="design-image-wrapper">
            <img
              class="design-image"
              src="${imageUrl}"
              alt="${title}"
              loading="lazy"
              onerror="
                this.onerror=null;
                this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22500%22 height=%22600%22%3E%3Crect width=%22500%22 height=%22600%22 fill=%22%23eeeeee%22/%3E%3Ctext x=%22250%22 y=%22300%22 font-size=%2220%22 text-anchor=%22middle%22 fill=%22%23666666%22%3ENo Image%3C/text%3E%3C/svg%3E';
              "
            >
          </div>

          <div class="design-card-content">
            <h3>${title}</h3>
            <p>${description}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

/* ===============================
   Edit Design
================================ */

window.editDesign = function (id) {
  const item = allDesigns.find(
    (design) => design.id === id,
  );

  if (!item) return;

  const category = normalizeCategory(item.category);
  const title = getCategoryTitle(category);
  const description = getCategoryDescription(
    category,
    title,
  );

  if ($("designId")) {
    $("designId").value = item.id;
  }

  if ($("category")) {
    $("category").value = category;
  }

  if ($("title")) {
    $("title").value = title;
  }

  if ($("description")) {
    $("description").value = description;
  }

  if ($("published")) {
    $("published").checked = item.is_published;
  }

  if ($("imageUrl")) {
    $("imageUrl").value = item.image_url || "";
  }

  if ($("formTitle")) {
    $("formTitle").textContent = "Design Edit करें";
  }

  if ($("saveBtn")) {
    $("saveBtn").textContent = "Update Design";
  }

  editingId = item.id;

  preview();

  $("formPanel")?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

/* ===============================
   Delete Design
================================ */

window.deleteDesign = async function (id) {
  if (!sb) {
    showMsg("Supabase connection उपलब्ध नहीं है।", "error");
    return;
  }

  const confirmed = confirm(
    "क्या आप यह design delete करना चाहते हैं?",
  );

  if (!confirmed) return;

  const { error } = await sb
    .from("designs")
    .delete()
    .eq("id", id);

  if (error) {
    showMsg(error.message, "error");
    return;
  }

  showMsg("Design सफलतापूर्वक delete हो गया।");

  await loadDesigns();
};

/* ===============================
   Start
================================ */

document.addEventListener("DOMContentLoaded", () => {
  initGalleryFilters();

  if ($("category") && !$("category").value) {
    $("category").value = "अन्य";
  }

  updateAutoFields();
});

init();