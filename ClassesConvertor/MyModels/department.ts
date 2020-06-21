import Employee from './employee';

export default class Department {
	public name: string;
	public employees: Array<Employee>;	

	constructor() {
		this.employees = new Array<Employee>();	
	}
}