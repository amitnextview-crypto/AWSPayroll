const Expense = require("../models/expense-model");

class ExpenseService {
  async create(data) {
    return await Expense.create(data);
  }
  async find(query = {}) {
    return await Expense.find(query);
  }
  async findById(id) {
    return await Expense.findById(id);
  }
  async update(id, data) {
    return await Expense.findByIdAndUpdate(id, data, { new: true });
  }
  async delete(id) {
    return await Expense.findByIdAndDelete(id);
  }
}

module.exports = new ExpenseService();
