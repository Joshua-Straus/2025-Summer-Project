let container; //Div for assets
let assetData; //assets.json data
let assetEditorActive = false; //Whether an editor is active
let howHeldOptions = []; //Data from static/data/how_held.json


/*
Fetches data from how_held.json and loads into howHeldOptions
 */
fetch('/static/data/how_held.json')
  .then(response => {
    if (!response.ok) throw new Error("Failed to load how_held.json");
    return response.json();
  })
  .then(data => {
    howHeldOptions = data.how_held || [];
  })
  .catch(err => {
    console.error("Error loading how_held options:", err);
  });





/*
When content is loaded onto webpage -> load asset data to display buttons
*/
window.addEventListener('DOMContentLoaded', () => {
  container = document.getElementById('buttonBox');

  fetch('/static/data/assets.json')
    .then(response => {
      if (!response.ok) throw new Error("Failed to load JSON");
      return response.json();
    })
    .then(data => {
      assetData = data;
      renderAssetButtons(data, container);
    })
    .catch(err => {
      console.error("Error loading asset data:", err);
    });
});





/**
 * renders necessary buttons in container
 * @param {*} data 
 */
function renderAssetButtons(data) {
  container.innerHTML = "";

  data.asset_types.forEach(asset => {
    const btn = document.createElement('button');
    btn.textContent = asset.name;
    btn.classList.add("assetButton");
    btn.addEventListener('click', () => assetClicked(asset));
    container.appendChild(btn);
  });

  const showAssetsButton = document.createElement("button");
  showAssetsButton.id = "showAssetsButton";
  showAssetsButton.innerHTML = "Show Assets";
  showAssetsButton.addEventListener("click", () => showUserData(container, data));
  container.appendChild(showAssetsButton);
}

/**
 * Shows user data in container when showAssetsButton is pressed
 * @param {*} container 
 * @param {*} data 
 */
function showUserData(container, data) {
  fetch('/getUserData')
    .then(response => {
      if (!response.ok) throw new Error("Failed to load user data");
      return response.json();
    })
    .then(userData => {
      container.innerHTML = ""; // Clear buttons

      if (Array.isArray(userData) && userData.length > 0) {
        userData.forEach((entry, index) => {
            const entryDiv = document.createElement("div");
            entryDiv.classList.add("userDataEntry");

            for (const [key, value] of Object.entries(entry)) {
                const field = document.createElement("p");
                field.innerHTML = `<strong>${key}:</strong> ${value}`;
                entryDiv.appendChild(field);
            }

            //THIS BELONGS INSIDE THE LOOP
            const editBtn = document.createElement("button");
            editBtn.textContent = "Edit";
            editBtn.addEventListener("click", () => {
                editAsset(entry, index);
        });
        entryDiv.appendChild(editBtn);

        container.appendChild(entryDiv);
        container.appendChild(document.createElement("hr"));
    });
      } else {
        container.innerHTML = "<p>No user data available.</p>";
      }

      // Add back button
      const backBtn = document.createElement("button");
      backBtn.textContent = "Back";
      backBtn.addEventListener("click", () => {
        renderAssetButtons(data, container); // Go back to asset buttons
      });
      container.appendChild(backBtn);
    })
    .catch(err => {
      container.innerHTML = `<p style="color: red;">Error fetching user data: ${err.message}</p>`;
    });
}

/**
 * When asset is clicked -> start assetEditor
 * @param {*} asset 
 * @returns 
 */
function assetClicked(asset) {
  if (assetEditorActive) return;

  for (let child of container.children) {
    child.style.display = "none";
  }

  showAssetEditor(asset);
}

/**
 * Main logic for asset editing
 * @param {*} asset 
 * @param {*} container 
 */
function showAssetEditor(asset) {
  assetEditorActive = true;

  const form = document.createElement("form");
  form.id = "assetForm";

  //Add subtype dropdown if subtypes exist
  if (Array.isArray(asset.subtypes) && asset.subtypes.length > 0) {
    const subtypeLabel = document.createElement("label");
    subtypeLabel.setAttribute("for", "subtype");
    subtypeLabel.innerHTML = `Subtype <span style="font-style: italic; color: gray;">(required)</span>`;

    const select = document.createElement("select");
    select.id = "subtype";
    select.name = "subtype";
    select.required = true;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Select a subtype --";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    asset.subtypes.forEach(subtype => {
      const option = document.createElement("option");
      option.value = subtype;
      option.textContent = subtype;
      select.appendChild(option);
    });

    const subtypeContainer = document.createElement("div");
    subtypeContainer.appendChild(subtypeLabel);
    subtypeContainer.appendChild(select);
    form.appendChild(subtypeContainer);
  }

  //Add form fields
  for (const [key, status] of Object.entries(asset.fields)) {
    const isRequired = status.toLowerCase() === "required";

    const label = document.createElement("label");
    label.setAttribute("for", key);
    label.innerHTML = `${key} <span style="font-style: italic; color: gray;">(${isRequired ? 'required' : 'optional'})</span>`;

    let input;

    if (key === "how_held") {
    input = document.createElement("select");
    input.id = key;
    input.name = key;
    if (isRequired) input.required = true;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Select how held --";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    input.appendChild(defaultOption);

    howHeldOptions.forEach(optionText => {
        const option = document.createElement("option");
        option.value = optionText;
        option.textContent = optionText;
        input.appendChild(option);
    });
    } else {
        input = document.createElement("input");
        input.id = key;
        input.name = key;
        if (isRequired) input.required = true;
    }

    const fieldContainer = document.createElement("div");
    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    form.appendChild(fieldContainer);
  }

  //Add buttons
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Enter";
  submitBtn.type = "submit";

  const exitBtn = document.createElement("button");
  exitBtn.textContent = "Exit";
  exitBtn.type = "button";
  exitBtn.addEventListener("click", () => exitForm(container, form));

  form.appendChild(submitBtn);
  form.appendChild(exitBtn);

  form.addEventListener("submit", event => {
    event.preventDefault();
    enterForm(form, asset, () => {
    assetEditorActive = false;
    renderAssetButtons(assetData);
  });
  });

  container.appendChild(form);
}


/**
 * Main logic for entering form in asset editor
 * @param {*} form 
 * @param {*} asset 
 * @param {*} onSuccess 
 */
function enterForm(form, asset, onSuccess) {
  const formData = new FormData(form);
  const userData = {
    "Asset": asset.name
  };

  for (const [key, value] of formData.entries()) {
    userData[key] = value;
  }

  fetch('/saveUserData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      alert("Data saved successfully");
      if (onSuccess) onSuccess();
    })
    .catch(error => {
      console.error('Error:', error);
      alert("Failed to save data");
    });
}

/**
 * Logic for exiting form
 * @param {*} container 
 * @param {*} form 
 */
function exitForm(container, form) {
  assetEditorActive = false;
  container.removeChild(form);

  for (let child of container.children) {
    child.style.display = "inline-block"; // use block if prefer
  }
}

function editAsset(entry, index) {
  const assetType = assetData.asset_types.find(a => a.name === entry.Asset);
  if (!assetType) {
    alert("Asset type not recognized.");
    return;
  }

  container.innerHTML = "";
  assetEditorActive = true;

  const form = document.createElement("form");
  form.id = "editAssetForm";

  // Include subtype dropdown
  if (Array.isArray(assetType.subtypes) && assetType.subtypes.length > 0) {
    const subtypeLabel = document.createElement("label");
    subtypeLabel.setAttribute("for", "subtype");
    subtypeLabel.innerHTML = `Subtype <span style="font-style: italic; color: gray;">(required)</span>`;

    const select = document.createElement("select");
    select.id = "subtype";
    select.name = "subtype";
    select.required = true;

    const defaultOption = document.createElement("option");
    defaultOption.textContent = "-- Select a subtype --";
    defaultOption.disabled = true;
    select.appendChild(defaultOption);

    assetType.subtypes.forEach(sub => {
      const option = document.createElement("option");
      option.value = sub;
      option.textContent = sub;
      if (entry.subtype === sub) option.selected = true;
      select.appendChild(option);
    });

    const containerDiv = document.createElement("div");
    containerDiv.appendChild(subtypeLabel);
    containerDiv.appendChild(select);
    form.appendChild(containerDiv);
  }

  // Fields
  for (const [key, status] of Object.entries(assetType.fields)) {
    const isRequired = status.toLowerCase() === "required";

    const label = document.createElement("label");
    label.setAttribute("for", key);
    label.innerHTML = `${key} <span style="font-style: italic; color: gray;">(${isRequired ? 'required' : 'optional'})</span>`;

    let input;
    if (key === "how_held") {
      input = document.createElement("select");
      input.name = key;
      input.required = isRequired;

      howHeldOptions.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt;
        if (entry[key] === opt) option.selected = true;
        input.appendChild(option);
      });
    } else {
      input = document.createElement("input");
      input.name = key;
      input.value = entry[key] || "";
      input.required = isRequired;
    }

    const fieldContainer = document.createElement("div");
    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    form.appendChild(fieldContainer);
  }

  // Buttons
  const saveBtn = document.createElement("button");
  saveBtn.textContent = "Save Changes";
  saveBtn.type = "submit";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.type = "button";
  cancelBtn.addEventListener("click", () => {
    assetEditorActive = false;
    showUserData(container, assetData);
  });

  form.appendChild(saveBtn);
  form.appendChild(cancelBtn);

  form.addEventListener("submit", event => {
    event.preventDefault();

    const updatedData = { Asset: assetType.name };
    const formData = new FormData(form);
    for (const [key, val] of formData.entries()) {
      updatedData[key] = val;
    }

    fetch('/updateUserData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ index: index, updated: updatedData })
    })
      .then(res => res.json())
      .then(response => {
        alert("Asset updated.");
        assetEditorActive = false;
        showUserData(container, assetData);
      })
      .catch(err => {
        alert("Failed to update asset.");
        console.error(err);
      });
  });

  container.appendChild(form);
}
