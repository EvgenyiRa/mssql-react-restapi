/*01*/const query = require('../db_apis/query.js'),
            dbConfig = require('../config/database.js'),
            execquery = require('../db_apis/execquery.js'),
            database = require('../services/database.js');
/*02*/
/*03*/async function post(req, res, next) {
        //console.log('req.body',req.body);
        if ((!!req.body.id) && (!!req.body.token) && (!!req.body.database)) {
          try {
            //ищем подходящие настройки БД
            const context = {};
            context.sql=`SELECT sys_context('USERENV', 'SERVER_HOST')  SERVER_HOST FROM dual`;
            let pr_searche=false;
            for (var i = 0; (i<dbConfig.hrPool.length) ; i++) {
                context.city=dbConfig.hrPool[i].poolAlias;
                let rowsF=await query.find(context);
                if (rowsF.length>0) {
                  if (rowsF[0].SERVER_HOST.toUpperCase()===req.body.database) {
                    pr_searche=true;
                    break;
                  }
                }
            }
            if (pr_searche) {
              //ищем токен в БД
              context.params={id:req.body.id,token:req.body.token};
              context.sql=`SELECT parameters_list
                             FROM web_token
                            WHERE id = :id
                              AND guid = :token`;
              const rowsT = await query.find(context);
              if (rowsT.length>0) {
                //удаляем токен
                const contextExec={};
                contextExec.city=context.city;
                contextExec.exec_params_in={id:req.body.id,token:req.body.token};
                contextExec.execsql=`DELETE FROM web_token
                                      WHERE id = :id
                                        AND guid = :token`;
                const rowsTD = execquery.find(contextExec);

                //авторизуемся на пользователе
                const authuserlogin='admin_r';
                context.params={login:authuserlogin};
                context.sql=`SELECT USER_ID,
                                    NVL(FIO,'null') FIO,
                                    NVL(EMAIL,'null') EMAIL,
                                    NVL(PHONE,'null') PHONE,
                                    SOL
                               FROM REP_USERS
                              WHERE LOGIN=:login`;
                const rows = await query.find(context);
                if (rows.length>0) {
                     const resAuthUser=await database.authUser(req,rows,context);
                     resAuthUser.params=rowsT[0].PARAMETERS_LIST;
                     return res.status(200).json(resAuthUser);
                }
                else {
                    return res.status(200).json({ message: 'Пользователь не найден' });
                }
              }
              else {
                  return res.status(200).json({ message: 'Ошибка токена' });
              }
            }
            else {
                return res.status(200).json({ message: 'Ошибка передачи данных о БД' })
            }
          } catch (err) {
            next(err);
          }
        }
        else {
            return res.status(200).json({ message: 'Data error' });
        }


}

module.exports.post = post;
