/*
WEB-OLAP v1.0
Copyright 2020 Rassadnikov Evgeniy Alekseevich

This file is part of WEB-OLAP.

WEB-OLAP is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

WEB-OLAP is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with WEB-OLAP.  If not, see <https://www.gnu.org/licenses/>.
 */
 CREATE SEQUENCE rep_users_id_sq;
 CREATE TABLE IF NOT EXISTS rep_users
 (
     user_id numeric(17) NOT NULL DEFAULT nextval('rep_users_id_sq'),
     fio character varying(500) NOT NULL,
     login character varying(200) NOT NULL,
     password character varying(200) NOT NULL,
     email character varying(500),
     phone character varying(100),
     sol numeric(2),
     PRIMARY KEY (user_id),
     CONSTRAINT ulpu UNIQUE (login, password)
 );
