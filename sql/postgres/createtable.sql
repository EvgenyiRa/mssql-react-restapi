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

 DO $$DECLARE user_id_v numeric(17);
 BEGIN
    EXECUTE 'CREATE SEQUENCE rep_users_id_sq';
    EXECUTE 'CREATE SEQUENCE rep_rights_id_sq START 1005';
    EXECUTE 'CREATE SEQUENCE rep_users_rights_id_sq';

    EXECUTE 'CREATE TABLE IF NOT EXISTS rep_users
 	 (
 		 user_id numeric(17) NOT NULL DEFAULT nextval(''rep_users_id_sq''),
 		 fio character varying(500) NOT NULL,
 		 login character varying(200) NOT NULL,
 		 password character varying(200) NOT NULL,
 		 email character varying(500),
 		 phone character varying(100),
 		 sol numeric(2),
 		 PRIMARY KEY (user_id),
 		 UNIQUE (login, password)
 	 )';

    EXECUTE 'CREATE TABLE IF NOT EXISTS rep_rights
 	(
 		rights_id numeric(5) NOT NULL DEFAULT nextval(''rep_rights_id_sq''),
 		name character varying(500) NOT NULL,
 		sysname character varying(200) NOT NULL UNIQUE,
 		PRIMARY KEY (rights_id)
 	)';

    EXECUTE 'CREATE TABLE IF NOT EXISTS rep_users_rights
 	(
 		rur_id numeric(17) NOT NULL DEFAULT nextval(''rep_users_rights_id_sq''),
 		user_id numeric(17) NOT NULL,
 		right_id numeric(5) NOT NULL,
 		PRIMARY KEY (rur_id),
 		  UNIQUE(user_id,right_id)
 	)';

    INSERT INTO rep_rights (rights_id, name, sysname)
    VALUES (1, 'Редактирование формы', 'Edite'),
 		  (2, 'Просмотр формы', 'View'),
 		  (1002, 'Удаление формы', 'Delete'),
 		  (1004, 'Администрирование пользователей', 'Admin');
    user_id_v:=nextval('rep_users_id_sq');
    INSERT INTO REP_USERS (user_id,fio, login, password, email, phone, sol)
 	 VALUES (user_id_v,'admin', 'admin', '$2a$10$A.6oNVSpds0uiBe9PwjgBe/.HQ.r5M.4O/rFXw5Rit.uk3O6Rw06C', NULL, NULL, 1);
    INSERT INTO rep_users_rights (user_id, right_id)
    VALUES (user_id_v, 1),
 		  (user_id_v, 2),
 		  (user_id_v, 1002),
 		  (user_id_v, 1004);
 END$$;
