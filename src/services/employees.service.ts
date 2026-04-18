import { EmployeesRepository } from "@/repositories/employees.repository";

const employeesRepository = new EmployeesRepository();

export class EmployeesService {
  async listEmployees(department?: string) {
    return employeesRepository.listByDepartment(department);
  }

  async getEmployee(id: number) {
    return employeesRepository.getById(id);
  }
}
