const UserModel = require('../models/user-model');
const LeaveModel = require('../models/leave-model');
const UserSalaryModel = require('../models/user-salary');
const bcrypt = require('bcrypt');

class UserService {
  createUser = async (user) => await UserModel.create(user);

  deleteUser = async (_id, user) => await UserModel.deleteOne({ _id }, user);

  updateUser = async (_id, user) => await UserModel.updateOne({ _id }, user);

  findCount = async (filter) => await UserModel.find(filter).countDocuments();

  findUser = async (filter) => await UserModel.findOne(filter);

  findUsers = async (filter) => await UserModel.find(filter).populate('team');

  verifyPassword = async (password, hashPassword) => await bcrypt.compare(password, hashPassword);

  resetPassword = async (_id, password) => await UserModel.updateOne({ _id }, { password });

  updatePassword = async (_id, password) => await UserModel.updateOne({ _id }, { password });


  findLeaders = async () =>
    await UserModel.aggregate([
      { $match: { type: 'leader' } },
      {
        $lookup: {
          from: 'teams',
          localField: '_id',
          foreignField: 'leader',
          as: 'team',
        },
      },
    ]);

  findFreeLeaders = async () =>
    await UserModel.aggregate([
      { $match: { type: 'leader' } },
      {
        $lookup: {
          from: 'teams',
          localField: '_id',
          foreignField: 'leader',
          as: 'team',
        },
      },
      { $match: { team: { $eq: [] } } },
    ]);

  createLeaveApplication = async (data) => LeaveModel.create(data);

  findLeaveApplication = async (data) => LeaveModel.findOne(data);

  findAllLeaveApplications = async (data) => LeaveModel.find(data);

  // 💰 Salary management
  assignSalary = async (data) => UserSalaryModel.create(data);

  findSalary = async (data) =>
    UserSalaryModel.findOne(data).populate('employeeID', 'name email username mobile type designation address profile');

  findAllSalary = async (data = {}) =>
    UserSalaryModel.find(data).populate('employeeID', 'name email username mobile type designation address profile');

updateEmployeeSalary = async (data, updatedSalary) => {
  return await UserSalaryModel.findOneAndUpdate(data, updatedSalary, { new: true });
};




  updateLeaveApplication = async (id, updatedLeave) =>
    LeaveModel.findByIdAndUpdate(id, updatedLeave);
}

module.exports = new UserService();