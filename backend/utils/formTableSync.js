// utils/formTableSync.js
const catchAsync = require('./catchAsync');

// Universal function for form submission aur table update
const syncFormWithTable = (formId, apiEndpoint, tableId, renderRow) => {
    const form = document.getElementById(formId);
    const tableBody = document.querySelector(`#${tableId} tbody`);

    if (!form || !tableBody) {
        console.error('Form ya Table nahi mila!');
        return;
    }

    form.addEventListener('submit', catchAsync(async (event) => {
        event.preventDefault(); // Form ke default submit ko rokna
        const formData = new FormData(form);

        // Backend ko data bhejo
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Form submit nahi hua!');
        }

        const newData = await response.json(); // Backend se naya data lo
        // Table mein new row add karo
        const rowHtml = renderRow(newData); // Custom function to render row
        tableBody.insertAdjacentHTML('beforeend', rowHtml);

        // Form reset karo (optional)
        form.reset();
    }));
};

module.exports = { syncFormWithTable };