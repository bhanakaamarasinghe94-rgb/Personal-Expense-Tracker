
"use strict";

// Get HTML elements
const transactionForm = document.getElementById("transactionForm");

const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");

const totalIncomeElement = document.getElementById("totalIncome");
const totalExpensesElement = document.getElementById("totalExpenses");
const currentBalanceElement = document.getElementById("currentBalance");

const transactionTable = document.getElementById("transactionTable");
const filterType = document.getElementById("filterType");
const searchInput = document.getElementById("searchInput");
const emptyMessage = document.getElementById("emptyMessage");

// Load previously saved transactions
let transactions = [];

try {
    const savedTransactions = localStorage.getItem("expenseTrackerTransactions");

    if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);

        if (Array.isArray(parsedTransactions)) {
            transactions = parsedTransactions.filter(transaction =>
                transaction &&
                (transaction.type === "Income" ||
                    transaction.type === "Expense") &&
                typeof transaction.description === "string" &&
                typeof transaction.category === "string" &&
                typeof transaction.date === "string" &&
                Number.isFinite(transaction.amount) &&
                transaction.amount > 0 &&
                Number.isSafeInteger(transaction.id)
            );
        }
    }
} catch (error) {
    console.error("Could not load saved transactions:", error);
    transactions = [];
}

// Set today's date as the default date
function setTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    dateInput.value = `${year}-${month}-${day}`;
}

setTodayDate();

// Format amounts as Sri Lankan Rupees
function formatCurrency(amount) {
    return "LKR " + amount.toLocaleString("en-LK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Save transactions to localStorage
function saveTransactions() {
    try {
        localStorage.setItem(
            "expenseTrackerTransactions",
            JSON.stringify(transactions)
        );
    } catch (error) {
        console.error("Could not save transactions:", error);

        alert(
            "The transaction could not be saved in browser storage. " +
            "Check your browser settings."
        );

        return false;
    }

    return true;
}

// Calculate income, expenses, and balance
function updateSummary() {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(function (transaction) {
        if (transaction.type === "Income") {
            totalIncome += transaction.amount;
        } else if (transaction.type === "Expense") {
            totalExpenses += transaction.amount;
        }
    });

    const balance = totalIncome - totalExpenses;

    totalIncomeElement.textContent = formatCurrency(totalIncome);
    totalExpensesElement.textContent = formatCurrency(totalExpenses);
    currentBalanceElement.textContent = formatCurrency(balance);
}

// Format date for the transaction table
function formatDate(dateString) {
    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Create a table cell safely
function createCell(value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
}

// Display transactions in the table
function displayTransactions() {
    
    // Clear existing table rows
    transactionTable.replaceChildren();

    // Get selected filter
    const selectedType = filterType.value;

    // Get search text
    const searchText = searchInput.value.trim().toLowerCase();

    // Filter transactions
    const filteredTransactions = transactions.filter(function (transaction) {
        const matchesType =
            selectedType === "All" ||
            transaction.type === selectedType;

        const matchesSearch =
            transaction.description.toLowerCase().includes(searchText) ||
            transaction.category.toLowerCase().includes(searchText) ||
            transaction.date.includes(searchText) ||
            transaction.type.toLowerCase().includes(searchText);

        return matchesType && matchesSearch;
    });

    // Display newest transactions first
    filteredTransactions.sort(function (a, b) {
        if (a.date !== b.date) {
            return b.date.localeCompare(a.date);
        }

        return b.id - a.id;
    });

    // Show message when there are no matching transactions
    emptyMessage.hidden = filteredTransactions.length > 0;

    if (filteredTransactions.length === 0) {
        if (transactions.length > 0) {
            emptyMessage.textContent =
                "No matching transactions found.";
        } else {
            emptyMessage.textContent =
                "No transactions found. Add your first transaction above.";
        }
    }

    // Create a row for each transaction
    filteredTransactions.forEach(function (transaction) {
        const row = document.createElement("tr");

        // Date
        row.appendChild(createCell(formatDate(transaction.date)));

        // Description
        row.appendChild(createCell(transaction.description));

        // Type
        const typeCell = document.createElement("td");
        const typeBadge = document.createElement("span");

        typeBadge.textContent = transaction.type;
        typeBadge.classList.add("type-badge");

        if (transaction.type === "Income") {
            typeBadge.classList.add("income-badge");
        } else {
            typeBadge.classList.add("expense-badge");
        }

        typeCell.appendChild(typeBadge);
        row.appendChild(typeCell);

        // Category
        row.appendChild(createCell(transaction.category));

        // Amount
        const amountCell = document.createElement("td");
        amountCell.textContent = formatCurrency(transaction.amount);

        if (transaction.type === "Income") {
            amountCell.classList.add("income-amount");
        } else {
            amountCell.classList.add("expense-amount");
        }

        row.appendChild(amountCell);

        // Action button
        const actionCell = document.createElement("td");
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.type = "button";
        deleteButton.classList.add("btn-delete");
        deleteButton.setAttribute(
            "aria-label",
            "Delete transaction: " + transaction.description
        );

        // Delete the selected transaction
        deleteButton.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });

        actionCell.appendChild(deleteButton);
        row.appendChild(actionCell);

        // Add row to the table
        transactionTable.appendChild(row);
    });
}

// Add a new transaction
transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    // Get form values
    const type = typeInput.value;
    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;

    // Validate required fields
    if (!type || !description || !category || !date) {
        alert("Please complete all required fields.");
        return;
    }

    // Validate transaction type
    if (type !== "Income" && type !== "Expense") {
        alert("Please select a valid transaction type.");
        return;
    }

    // Validate amount
    if (
        amountInput.value.trim() === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert("Please enter an amount greater than zero.");
        amountInput.focus();
        return;
    }

    // Validate date
    const selectedDate = new Date(date + "T00:00:00");
  

    // Create a transaction object
    const transaction = {
        id: Date.now(),
        type: type,
        description: description,
        amount: amount,
        category: category,
        date: date
    };

    // Add transaction
    transactions.push(transaction);

    // Save and update the interface
    if (!saveTransactions()) {
        transactions.pop();
        return;
    }

    updateSummary();
    displayTransactions();

    // Reset the form
    transactionForm.reset();
    setTodayDate();

    // Show confirmation
    alert("Transaction added successfully!");
});

// Delete an existing transaction
function deleteTransaction(id) {
    const transaction = transactions.find(function (item) {
        return item.id === id;
    });

    if (!transaction) {
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
        return;
    }

    // Keep the original list in case saving fails
    const previousTransactions = transactions;

    transactions = transactions.filter(function (item) {
        return item.id !== id;
    });

    if (!saveTransactions()) {
        transactions = previousTransactions;
        return;
    }

    updateSummary();
    displayTransactions();
}

// Filter transactions by type
filterType.addEventListener("change", function () {
    displayTransactions();
});

// Search transactions
searchInput.addEventListener("input", function () {
    displayTransactions();
});

// Clear the form without deleting transactions
transactionForm.addEventListener("reset", function () {
    setTimeout(function () {
        setTodayDate();
    }, 0);
});

// Initial display when the page loads
updateSummary();
displayTransactions();
