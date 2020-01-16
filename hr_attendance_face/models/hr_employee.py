# -*- coding: utf-8 -*-

from odoo import api, models


class HrEmployee(models.Model):
    _inherit = "hr.employee"

    @api.model
    def get_employee_from_code(self, employee_code):
        employee = self.sudo().search(
            [('barcode', '=', employee_code)], limit=1)
        if employee:

            print(employee.attendance_state)
            return {
                'employee_id': employee.id,
                'employee_name': employee.name,
                'employee_state': employee.attendance_state,
                'employee_hours_today': employee.hours_today
            }
        return False
