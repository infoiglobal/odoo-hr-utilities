# -*- coding: utf-8 -*-
{
    'name': 'HR Attendance Face Detection',
    'version': '1.0',
    'category': 'hr',
    "license": "OPL-1",
    # 'price': 49,
    # 'currency': 'EUR',
    'description': """
    """,
    'author': '',
    'depends': [
        'base',
        'hr',
        'hr_attendance'
    ],
    'data': [

        'views/assets_backend_view.xml',
    ],

    'test': [],
    'demo': [],
    'qweb': [
        'static/src/xml/attendance_face.xml',

    ],
    'images': ['static/description/banner.jpg'],
    'installable': True,
    'active': True,
    'application': False,
}
