const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/easy_employee");

const Expense = mongoose.model("Expense", new mongoose.Schema({
  employeeID: String,
  name: String,
  department: String,
  expenseDate: String,
  category: String,
  description: String,
  amount: Number,
  paymentMode: String,
  status: String
}));

const data = [ /* same array as above */ ];

Expense.insertMany(data)
  .then(() => {
    console.log(db.expenses.insertMany([
  {
    employeeID: "EMP001",
    name: "Rohit Sharma",
    department: "Sales",
    expenseDate: "2025-10-15",
    category: "Travel",
    description: "Client meeting in Delhi",
    amount: 3200,
    paymentMode: "Credit Card",
    status: "Approved"
  },
  {
    employeeID: "EMP002",
    name: "Priya Verma",
    department: "Marketing",
    expenseDate: "2025-10-17",
    category: "Office Supplies",
    description: "Purchased brochures and flyers",
    amount: 1250,
    paymentMode: "Cash",
    status: "Pending"
  },
  {
    employeeID: "EMP003",
    name: "Amit Kumar",
    department: "Engineering",
    expenseDate: "2025-10-20",
    category: "Software Subscription",
    description: "Figma annual license",
    amount: 5400,
    paymentMode: "UPI",
    status: "Approved"
  },
  {
    employeeID: "EMP004",
    name: "Sneha Iyer",
    department: "HR",
    expenseDate: "2025-10-21",
    category: "Team Lunch",
    description: "Monthly HR team lunch",
    amount: 2600,
    paymentMode: "Credit Card",
    status: "Rejected"
  },
  {
    employeeID: "EMP005",
    name: "Vikram Singh",
    department: "Finance",
    expenseDate: "2025-10-22",
    category: "Travel",
    description: "Conference trip to Mumbai",
    amount: 6800,
    paymentMode: "Debit Card",
    status: "Approved"
  },
  {
    employeeID: "EMP006",
    name: "Neha Gupta",
    department: "Support",
    expenseDate: "2025-10-25",
    category: "Internet Bill",
    description: "Monthly internet reimbursement",
    amount: 1200,
    paymentMode: "UPI",
    status: "Pending"
  },
  {
    employeeID: "EMP007",
    name: "Arjun Mehta",
    department: "Operations",
    expenseDate: "2025-10-27",
    category: "Transportation",
    description: "Cab expenses for site visit",
    amount: 950,
    paymentMode: "Cash",
    status: "Approved"
  }
]));
    mongoose.connection.close();
  })
  .catch(err => console.error(err));
