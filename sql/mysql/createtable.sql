/*!!!Обязательно установка опции lower_case_table_names = 1
https://askubuntu.com/questions/1261422/how-to-install-mysql-8-0-with-lower-case-table-names-1-on-ubuntu-server-20-04-lt*/
CREATE TABLE `rep_users` (
  `USER_ID` int NOT NULL AUTO_INCREMENT,
  `FIO` varchar(500) NOT NULL,
  `LOGIN` varchar(200) NOT NULL,
  `PASSWORD` varchar(200) NOT NULL,
  `EMAIL` varchar(500) DEFAULT NULL,
  `PHONE` varchar(100) DEFAULT NULL,
  `SOL` tinyint DEFAULT NULL,
  `KEY_V` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`USER_ID`),
  UNIQUE KEY `LOGIN_UNIQUE` (`LOGIN`),
  UNIQUE KEY `LOGIN_PWD` (`LOGIN`,`PASSWORD`),
  KEY `KEY_V` (`KEY_V`)
);

CREATE TABLE `rep_rights` (
  `RIGHTS_ID` INT(10) NOT NULL AUTO_INCREMENT,
  `NAME` VARCHAR(500) NOT NULL,
  `SYSNAME` VARCHAR(500) NOT NULL,
  PRIMARY KEY (`RIGHTS_ID`) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

CREATE TABLE `rep_users_rights` (
  `RUR_ID` BIGINT(19) NOT NULL AUTO_INCREMENT,
  `USER_ID` INT(17) NOT NULL,
  `RIGHT_ID` INT(10) NOT NULL,
  PRIMARY KEY (`RUR_ID`),
  UNIQUE INDEX `USER_ID_RIGHT_ID` (`USER_ID` ASC, `RIGHT_ID` ASC) VISIBLE)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;

/*CREATE TABLE `rep_calc_olap` (
  `CONTRACT_REFID` VARCHAR(10) NULL,
  `JUR_LS_REFID` VARCHAR(10) NULL,
  `PAYER_SNAME` VARCHAR(10) NULL,
  `ACCDATE` DATETIME NULL,
  `ENDACCDATE` DATETIME NULL,
  `INVOICE_DATE` DATETIME NULL,
  `SERVICE` VARCHAR(17) NULL,
  `CALC_VOLUME` DECIMAL(28,2) NULL,
  `CALC_COST` DECIMAL(28,2) NULL,
  `CALC_NET` DECIMAL(28,2) NULL,
  `TARIFF` VARCHAR(4) NULL,
  `VAT_RATE` DECIMAL(28,2) NULL)
ENGINE = InnoDB
DEFAULT CHARACTER SET = utf8;*/

CREATE TABLE `rep_users_control` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rep_users_id` int NOT NULL,
  `login` varchar(64) NOT NULL,
  `fio` varchar(150) DEFAULT NULL,
  `email` varchar(320) DEFAULT NULL,
  `phone` varchar(16) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rep_users_control_uid_l` (`rep_users_id`,`login`)
);

CREATE TABLE `rep_usr_cntrl_sys_lim` (
  `id` int(21) NOT NULL AUTO_INCREMENT,
  `rep_users_control_id` int(21) NOT NULL,
  `time_all` int(5) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `rep_users_control_id_UNIQUE` (`rep_users_control_id`)
);

CREATE TABLE `rep_usr_cntrl_prc_lim` (
`id` INT(21) NOT NULL AUTO_INCREMENT,
`rep_usr_cntrl_id` INT(21) NOT NULL,
`PRC_NAME` VARCHAR(250) NOT NULL,
`lim` INT(5) NOT NULL,
PRIMARY KEY (`id`),
UNIQUE INDEX `rep_usr_cntrl_prc_lim_idname` (`rep_usr_cntrl_id` ASC, `PRC_NAME` ASC) VISIBLE);

CREATE TABLE `rep_usr_cntrl_sys_state` (
  `id` INT(21) NOT NULL AUTO_INCREMENT,
  `rep_usr_cntrl_id` INT(21) NOT NULL,
  `time_all` INT(5) NOT NULL,
  `date` DATE NOT NULL,
  `access` TINYINT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `rep_usr_cntrl_sys_state_iddate` (`rep_usr_cntrl_id` ASC, `date` ASC) VISIBLE);

CREATE TABLE `react`.`rep_usr_cntrl_prc_state` (
  `id` INT(21) NOT NULL AUTO_INCREMENT,
  `rep_usr_cntrl_id` INT(21) NOT NULL,
  `date` DATE NULL,
  `prc_name` VARCHAR(250) NULL,
  `pid` INT NULL,
  `access` TINYINT(1) NULL,
  `last_Time` INT(19) NULL,
  `time_All` INT(19) NULL,
  `time_All_Delta` INT(5) NULL,
  `time_All_usr` INT(19) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `rep_usr_cntrl_prc_state_iddp` (`rep_usr_cntrl_id` ASC, `date` ASC, `prc_name` ASC) VISIBLE);



INSERT INTO `rep_users_control`
(`rep_users_id`,
`login`)
VALUES (
1,
'dasha');

INSERT INTO `rep_usr_cntrl_sys_lim`
(`rep_users_control_id`,
`time_all`)
VALUES
(1,
10);

INSERT INTO `react`.`rep_usr_cntrl_prc_lim`
(`rep_usr_cntrl_id`,
`PRC_NAME`,
`lim`)
VALUES
(1,
'chrome',
10);

INSERT INTO REP_RIGHTS (RIGHTS_ID, NAME, SYSNAME)
   VALUES (1, 'Редактирование формы', 'Edite'),
		  (2, 'Просмотр формы', 'View'),
		  (1002, 'Удаление формы', 'Delete'),
		  (1004, 'Администрирование пользователей', 'Admin');
INSERT INTO REP_USERS (FIO, LOGIN, PASSWORD, EMAIL, PHONE, SOL)
   VALUES ('admin', 'admin', '$2a$10$A.6oNVSpds0uiBe9PwjgBe/.HQ.r5M.4O/rFXw5Rit.uk3O6Rw06C', NULL, NULL, 1);
SET @USER_ID_V := LAST_INSERT_ID();
INSERT INTO REP_USERS_RIGHTS (USER_ID, RIGHT_ID)
   VALUES (@USER_ID_V, 1),
		  (@USER_ID_V, 2),
		  (@USER_ID_V, 1002),
		  (@USER_ID_V, 1004);
