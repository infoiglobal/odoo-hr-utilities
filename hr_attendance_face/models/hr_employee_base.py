# -*- coding: utf-8 -*-

from odoo import api, models


class HrEmployeeBase(models.AbstractModel):
    _inherit = "hr.employee.base"

    @api.model
    def attendance_employee_id(self, employee_id):
        employee = self.sudo().search([('id', '=', employee_id)], limit=1)
        if employee:
            return employee._attendance_action(
                'hr_attendance.hr_attendance_action_kiosk_mode')
        return False
