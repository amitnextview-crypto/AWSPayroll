const Expense = require("../models/expense-model");
const expenseService = require("../services/expenseService");

class ExpenseController {
  // ➕ Add Expense (with file upload)
addExpense = async (req, res) => {
  try {
    const employeeID = req.user?._id; // From auth middleware
    const { type, amount, description, appliedDate } = req.body;

    if (!employeeID || !type || !amount) {
      console.log("Missing Fields:", { employeeID, type, amount });
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const expense = await expenseService.create({
      employeeID,
      type,
      amount,
      description,
      appliedDate,
    });

    res.json({ success: true, message: "Expense saved", data: expense });
  } catch (error) {
    console.error("Error saving expense:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 📄 Get All Expenses (with filters + role check)
async getExpenses(req, res) {
  try {
    const { type, adminResponse, appliedDate } = req.query;
    const filter = {};

    // 🔹 Non-admin users ke liye apne expenses hi dikhaye
    if (req.user?.type !== "admin") {
      filter.employeeID = req.user._id;
    }
    // 🔹 Agar admin hai to sabka data dikhaye (optional filter allowed)
    else if (req.query.employeeID) {
      filter.employeeID = req.query.employeeID;
    }

    if (type) filter.type = type;
    if (adminResponse) filter.adminResponse = adminResponse;
    if (appliedDate) filter.appliedDate = appliedDate;

    const data = await Expense.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ success: false, message: "Error fetching expenses" });
  }
}


  // 📄 Get All Expenses (with filters)
  // async getExpenses(req, res) {
  //   try {
  //     const { employeeID, type, adminResponse, appliedDate } = req.query;
  //     const filter = {};

  //     if (employeeID) filter.employeeID = employeeID;
  //     if (type) filter.type = type;
  //     if (adminResponse) filter.adminResponse = adminResponse;
  //     if (appliedDate) filter.appliedDate = appliedDate;

  //     const data = await Expense.find(filter).sort({ createdAt: -1 });
  //     res.status(200).json({ success: true, data });
  //   } catch (error) {
  //     console.error("Error fetching expenses:", error);
  //     res
  //       .status(500)
  //       .json({ success: false, message: "Error fetching expenses" });
  //   }
  // }

  // 🔍 Get Single Expense
  async getExpenseById(req, res) {
    try {
      const expense = await Expense.findById(req.params.id);
      if (!expense)
        return res
          .status(404)
          .json({ success: false, message: "Expense not found" });

      res.status(200).json({ success: true, expense });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error fetching expense" });
    }
  }

  // ✏️ Update Expense
  async updateExpense(req, res) {
    try {
      const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Expense not found" });

      res
        .status(200)
        .json({ success: true, message: "Expense updated", updated });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error updating expense" });
    }
  }

  async approveExpense(req, res) {
    try {
      const updated = await Expense.findByIdAndUpdate(
        req.params.id,
        { adminResponse: "Approved" },
        { new: true }
      );
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: "Expense not found" });
      res
        .status(200)
        .json({ success: true, message: "Expense approved", updated });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error approving expense" });
    }
  }

  // 🗑️ Delete Expense
  async deleteExpense(req, res) {
    try {
      const deleted = await Expense.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: "Expense not found" });

      res
        .status(200)
        .json({ success: true, message: "Expense deleted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Error deleting expense" });
    }
  }

  
}

module.exports = new ExpenseController();
