
const firebaseConfig = {
    apiKey: "AIzaSyCZPWPIQshE9B-aCk5fVM_dSCvcSSzX53w",
    authDomain: "budget-tracker-197ff.firebaseapp.com",
    databaseURL: "https://budget-tracker-197ff-default-rtdb.firebaseio.com",
    projectId: "budget-tracker-197ff",
    storageBucket: "budget-tracker-197ff.appspot.com",
    messagingSenderId: "113207774238",
    appId: "1:113207774238:web:2c68e83d728b935b78b20f"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const database = firebase.database();

const addBtn = document.getElementById("add-expense-btn");
const table = document.getElementById("expense-table");
const totalEl = document.getElementById("total");
const exportBtn = document.getElementById("export-csv-btn");

let expenseChart = null;


auth.onAuthStateChanged(user => {
    if (!user) {
        alert("Please login first");
        return;
    }

    const userId = user.uid;
    const expensesRef = database.ref(`users/${userId}/expenses`);

   
    addBtn.addEventListener("click", () => {
        const category = document.getElementById("category").value.trim();
        const description = document.getElementById("description").value.trim();
        const amount = parseFloat(document.getElementById("amount").value);

        if (!category || !description || isNaN(amount)) {
            alert("Please fill all fields");
            return;
        }

        expensesRef.push({
            category,
            description,
            amount,
            createdAt: Date.now()
        });

        document.getElementById("category").value = "";
        document.getElementById("description").value = "";
        document.getElementById("amount").value = "";
    });

  
    expensesRef.on("value", snapshot => {
        table.innerHTML = "";
        let total = 0;
        const expenses = [];

        snapshot.forEach(child => {
            const exp = child.val();
            const id = child.key;

            total += exp.amount;
            expenses.push({ id, ...exp });

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${exp.category}</td>
                <td>${exp.description}</td>
                <td>${exp.amount}</td>
                <td>
                    <button class="edit-btn" data-id="${id}">Edit</button>
                    <button class="delete-btn" data-id="${id}">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });

        totalEl.innerText = total;
        renderChart(expenses);

        exportBtn.onclick = () => exportToCSV(expenses);
    });

    
    document.addEventListener("click", e => {
        const id = e.target.dataset.id;
        if (!id) return;

        const ref = database.ref(`users/${userId}/expenses/${id}`);

        if (e.target.classList.contains("delete-btn")) {
            ref.remove();
        }

        if (e.target.classList.contains("edit-btn")) {
            ref.once("value").then(snapshot => {
                const exp = snapshot.val();
                if (!exp) return;

                const category = prompt("Edit Category:", exp.category);
                const description = prompt("Edit Description:", exp.description);
                const amount = prompt("Edit Amount:", exp.amount);

                if (!category || !description || isNaN(amount)) {
                    alert("Invalid input");
                    return;
                }

                ref.update({
                    category,
                    description,
                    amount: parseFloat(amount)
                });
            });
        }
    });
});


function renderChart(expenses) {
    const canvas = document.getElementById("expenseChart");
    const ctx = canvas.getContext("2d");

    const totals = {};
    expenses.forEach(e => {
        totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    if (expenseChart) expenseChart.destroy();

    expenseChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(totals),
            datasets: [{
                data: Object.values(totals)
            }]
        }
    });
}


function exportToCSV(expenses) {
    let csv = "Category,Description,Amount\n";
    expenses.forEach(e => {
        csv += `${e.category},${e.description},${e.amount}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "expenses.csv";
    link.click();
}
