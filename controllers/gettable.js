/*01*/const dbConfig = require('../config/database.js'),
            jwt = require('../config/jwt'),
            { performance } = require('perf_hooks');
      let $dbt='ora',
          oracledb,sql,database;
      if (!!dbConfig.dbtype) {
          $dbt=dbConfig.dbtype;
      }
      if ($dbt==='ora') {
          oracledb = require('oracledb');
      }
      else if ($dbt==='mssql') {
          sql = require('mssql');
          database = require('../services/database.js');
      }

      function secondstotime(time01,time00)
      {
          var secs=(time01-time00)/1000,
              t = new Date(1970,0,1);
          t.setSeconds(secs);
          var s = t.toTimeString().substr(0,8);
          if(secs > 86399)
              s = Math.floor((t - Date.parse("1/1/70")) / 3600000) + s.substr(2);
          s+=':'+String((time01-time00) % 1000);
          return s;
      }

/*03*/async function post(req, res, next) {
        //console.log('req.body',req.body);
        if (!!req.body.authorization) {
          //const authorization=req.body.authorization.toString();
          jwt.verify(req,jwt,async function(resAuath,tokenOne,user) {
            if (resAuath) {
              const time00 = performance.now();

              //настройки коннекта
              let $conn,
                  statement,
                  binds = {},
                  opts = {};
              if ($dbt==='ora') {
                if (!!req.body.opts) {
                    opts=context.opts;
                }
                opts.outFormat = oracledb.OUT_FORMAT_OBJECT;
                opts.autoCommit = true;
              }
              const $mass=req.body.data;
              let tab_temp;
              if (!!!req.body.tabname) {
                const timeMilli=String(performance.now()).split('.')[0];
                tab_temp="REP_TAB_"+$mass['tab_id']+"_"+timeMilli;
              }
              else {
                  tab_temp=req.body.tabname;
              }

              try {
                if ($dbt==='ora') {
                  $conn = await oracledb.getConnection();
                }
                else if ($dbt==='mssql') {
                  $conn = await database.poolPromise;
                }
                //const result = await conn.execute(statement, binds, opts);

                const $tab_str= $mass['tab_str'],
                      $tab_pok= $mass['tab_pok'],
                      $tab_val= $mass['tab_val'],
                      $tab_pol= $mass['tab_pol'],
                      $params_val_true=$mass['params_val'];
                      $data={};

                const $sql_true=$mass['sql_true'];

                let $tsql,
                    $count_all,
                    time01;

                $data['tabname']=tab_temp;
                if ($dbt==='mssql') {
                    if (!!!req.body.tabname) {
                      //получаем сразу и данные и структуру
                      let result = $conn.request();
                      for (var prop in $params_val_true) {
                        result.input(prop,$params_val_true[prop]);
                      }
                      result=await result.query($sql_true);
                      $count_all=result.recordsets[0].length;

                      //объёмная вставка
                      if ($count_all>0) {
                        const table = new sql.Table(tab_temp);
                        table.create = true;
                        //делаем цикл по result.recordsets[0][0], а не по result.recordset.columns, чтобы был одинаковый порядок полей
                        //при формировании структуры для добавления и при вставке строк
                        for (let prop in result.recordsets[0][0]) {
                          const $m=result.recordset.columns[prop];
                          table.columns.add($m['name'],
                                            {type: $m.type,
                                             length: $m.length,
                                             scale: $m.scale,
                                             precision: $m.precision
                                           },
                                           { nullable: $m['nullable'] }
                                         );

                        }
                        result.recordsets[0].forEach(row => {
                          const rowIn=[];
                          for (let prop in row) {
                            rowIn.push(row[prop]);
                          }
                          table.rows.add.apply(table.rows,rowIn)
                        });
                        let resInsert = $conn.request();
                        resInsert = await resInsert.bulk(table);
                      }
                    }
                    else {
                      time01 = performance.now();
                      $count_all=req.body.countall;
                    }
                }
                else if ($dbt=='ora') {
                    //$tsql="CREATE GLOBAL TEMPORARY TABLE "+tab_temp+" (";
                    if (!!!req.body.tabname) {
                      $tsql="CREATE TABLE "+tab_temp+" (";
                      const $ncols=await $conn.getStatementInfo($sql_true);
                      //$data['$ncols']=$ncols;
                      const $mass_ns=['TIMESTAMP','DATE','CLOB','LONG','BLOB','LONG RAW','RAW','XMLTYPE','UROWID'];
                      $ncols.metaData.forEach((item, i) => {
                          let $fieldMetadata={};
                          $fieldMetadata['NAME']=item.name;
                          $fieldMetadata['Type']=item.dbTypeName;
                          $fieldMetadata['Precision']=(!!item.precision)?item.precision:0;
                          $fieldMetadata['Scale']=(!!item.scale)?item.scale:0;
                          $fieldMetadata['Size']=(!!item.byteSize)?item.byteSize:0;
                          $tsql+='"'+$fieldMetadata['NAME']+'" '+$fieldMetadata['Type'];
                          if ((($fieldMetadata['Size']>0) || ($fieldMetadata['Precision']>0))
                              & ($mass_ns.indexOf($fieldMetadata['Type'])===-1)) {
                              $tsql+='(';
                              if ($fieldMetadata['Size']>0) {
                                  $tsql+=$fieldMetadata['Size'];
                              }
                              else if ($fieldMetadata['Precision']>0) {
                                  $tsql+=$fieldMetadata['Precision'];
                              }
                              if ($fieldMetadata['Scale']>0) {
                                  $tsql+=','+$fieldMetadata['Scale'];
                              }
                              $tsql+='),'+"\r\n";
                          }
                          else {
                              $tsql+=','+"\r\n";
                          }
                      });


                      $tsql=$tsql.slice(0, -3);
                      //$tsql+=") ON COMMIT PRESERVE ROWS";
                      $tsql+=")";
                      $data['sql_create_tab']=$tsql;
                      await $conn.execute($tsql, {}, opts);

                      $tsql="INSERT INTO "+tab_temp+" "+$sql_true;
                      binds=$params_val_true;
                      const resultInsert=await $conn.execute($tsql, binds, opts);
                      time01 = performance.now();
                      $data['timeCreateInsert']=secondstotime(time01,time00);
                      $count_all=resultInsert.rowsAffected;
                    }
                    else {
                      time01 = performance.now();
                      $count_all=req.body.countall;
                    }
                }

                //test
                $data['countall']=$count_all;
                $data['$tab_pok']=$tab_pok;

                if ($count_all===0) {
                    $data['tab_html']='<tbody><tr><td>Набор данных пуст</td></tr></tbody>';
                    $data['pr_null']=777;
                    $data['pr_null_text']='Ничего не найдено';
                }
                else {
                    let $rows_unic_pok=[],
                        $tab_pok_cool=[];

                    if ($tab_pok.length>0) {
                        //необходимо для красивого построения (считаем кол-во уникальных показателей по каждому с их упорядочиванием)
                        let $sql_unic_pok_cool="";
                        if ($dbt=='mssql') {
                            $sql_unic_pok_cool+="SET NOCOUNT ON;SET DATEFORMAT YMD;";
                        }
                        $sql_unic_pok_cool+="SELECT * FROM "
                                        +"("+
                                        "   SELECT COUNT(DISTINCT "+$tab_pok[0]['SYSNAME']+") COUNT, '"+$tab_pok[0]['SYSNAME']+"' SYSNAME,'"+$tab_pok[0]['NAME']+"' NAME"
                                           +"   FROM "+tab_temp;
                        for (var $i = 1; $i < $tab_pok.length; $i++) {
                            $sql_unic_pok_cool+=" UNION"
                                            +"  SELECT COUNT(DISTINCT "+$tab_pok[$i]['SYSNAME']+") COUNT, '"+$tab_pok[$i]['SYSNAME']+"' SYSNAME,'"+$tab_pok[$i]['NAME']+"' NAME"
                                              +"  FROM "+tab_temp;
                        }
                        $sql_unic_pok_cool+=  ") T"
                                            +" ORDER BY 1";
                        $data['$tab_pok']=$tab_pok;
                        $data['$sql_unic_pok_cool']=$sql_unic_pok_cool;

                        if ($dbt=='mssql') {
                            let $tab_pok_cool_result = $conn.request();
                            $tab_pok_cool_result=await $tab_pok_cool_result.query($sql_unic_pok_cool);
                            $tab_pok_cool=$tab_pok_cool_result.recordsets[0];
                        }
                        else if ($dbt=='ora') {
                            const $tab_pok_cool_result = await $conn.execute($sql_unic_pok_cool, {}, opts);
                            $tab_pok_cool=$tab_pok_cool_result.rows;
                        }

                        $data['tab_pok_cool']= $tab_pok_cool;

                        let $sql_unic_pok="SELECT * FROM (";
                        $sql_unic_pok+="SELECT DISTINCT "+$tab_pok_cool[0]['SYSNAME']+" FROM "+tab_temp;
                        $sql_unic_pok+=") T_"+$tab_pok_cool[0]['SYSNAME'];
                        for (var $i = 1; $i < $tab_pok_cool.length; $i++) {
                            $sql_unic_pok+=" JOIN (SELECT DISTINCT "+$tab_pok_cool[$i]['SYSNAME']+" FROM "+tab_temp+") T_"+$tab_pok_cool[$i]['SYSNAME']+" ON 1=1";
                        }
                        $sql_unic_pok+=" ORDER BY ";
                        $tab_pok_cool.forEach((item) => {
                            $sql_unic_pok+=item['SYSNAME']+",";
                        });

                        $sql_unic_pok=$sql_unic_pok.slice(0, -1);
                        $data['sql_unic_pok']=$sql_unic_pok;
                        if ($dbt=='mssql') {
                            let $rows_unic_pok_result = $conn.request();
                            $rows_unic_pok_result=await $rows_unic_pok_result.query($sql_unic_pok);
                            $rows_unic_pok=$rows_unic_pok_result.recordsets[0];
                        }
                        else if ($dbt=='ora') {
                            const $rows_unic_pok_result = await $conn.execute($sql_unic_pok, {}, opts);
                            $rows_unic_pok=$rows_unic_pok_result.rows;
                        }
                        $data['rows_unic_pok']= $rows_unic_pok;
                    }

                    let $sql_unic_str="",
                        $rows_unic_str=[],
                        $rowCount_unic_str=0;
                    if ($dbt=='mssql') {
                        $sql_unic_str+="SET NOCOUNT ON;SET DATEFORMAT YMD;";
                        $sql_unic_str+="SELECT DISTINCT ";
                        $tab_str.forEach((item) => {
                            $sql_unic_str+="["+item['SYSNAME']+"],";
                        });
                        $sql_unic_str=$sql_unic_str.slice(0, -1);
                        $sql_unic_str+=" FROM "+tab_temp+" ORDER BY ";
                        $tab_str.forEach((item) => {
                            $sql_unic_str+="["+item['SYSNAME']+"],";
                        });
                    }
                    else if ($dbt=='ora') {
                        $sql_unic_str+="SELECT DISTINCT ";
                        $tab_str.forEach((item) => {
                            $sql_unic_str+="\""+item['SYSNAME']+"\",";
                        });
                        $sql_unic_str=$sql_unic_str.slice(0, -1);
                        $sql_unic_str+=" FROM "+tab_temp+" ORDER BY ";
                        $tab_str.forEach((item) => {
                            $sql_unic_str+="\""+item['SYSNAME']+"\",";
                        });
                    }

                    $sql_unic_str=$sql_unic_str.slice(0, -1);
                    $data['sql_unic_str']=$sql_unic_str;
                    if ($dbt=='mssql') {
                        let $rows_unic_str_result = $conn.request();
                        $rows_unic_str_result=await $rows_unic_str_result.query($sql_unic_str);
                        $rowCount_unic_str=$rows_unic_str_result.recordsets[0];
                    }
                    else if ($dbt=='ora') {
                        const $rows_unic_str_result = await $conn.execute($sql_unic_str, {}, opts);
                        $rows_unic_str=$rows_unic_str_result.rows;
                        $rowCount_unic_str=$rows_unic_str.length;
                    }
                    $data['rows_unic_str']=$rows_unic_str;
                    $data['rowCount_unic_str']=$rowCount_unic_str;

                    let $sql_unic_val="";
                    if ($dbt=='mssql') {
                        $sql_unic_val+="SET NOCOUNT ON;SET DATEFORMAT YMD;";
                    }
                    $sql_unic_val+="WITH TAB AS (SELECT ";
                    $tab_str.forEach(($m) => {
                        if ($dbt=='mssql') {
                            $sql_unic_val+="["+$m['SYSNAME']+"],";
                        }
                        else if ($dbt=='ora') {
                            $sql_unic_val+="\""+$m['SYSNAME']+"\",";
                        }
                    });

                    if ($tab_pok.length>0) {
                        $tab_pok_cool.forEach(($m) => {
                            if ($dbt=='mssql') {
                                $sql_unic_val+="["+$m['SYSNAME']+"],";
                            }
                            else if ($dbt=='ora') {
                                $sql_unic_val+="\""+$m['SYSNAME']+"\",";
                            }
                        });
                    }

                    if ($dbt=='mssql') {
                        $tab_val.forEach(($m) => {
                            $sql_unic_val+='ISNULL('+$m['AGGR']+'(ISNULL(['+$m['SYSNAME']+"],0)),0) ["+$m['SYSNAME']+"],";
                        });
                    }
                    else if ($dbt=='ora') {
                        $tab_val.forEach(($m) => {
                            $sql_unic_val+='NVL('+$m['AGGR']+'(nvl("'+$m['SYSNAME']+'",0)),0) "'+$m['SYSNAME']+'",';
                        });
                    }
                    $sql_unic_val=$sql_unic_val.slice(0, -1);
                    $sql_unic_val+=" FROM "+tab_temp+" GROUP BY ";
                    if ($dbt=='mssql') {
                        $tab_str.forEach(($m) => {
                            $sql_unic_val+="["+$m['SYSNAME']+"],";
                        })
                    }
                    else if ($dbt=='ora') {
                        $tab_str.forEach(($m) => {
                            $sql_unic_val+="\""+$m['SYSNAME']+"\",";
                        })
                    }
                    if ($tab_pok_cool.length>0) {
                        if ($dbt=='mssql') {
                            $tab_pok_cool.forEach(($m) => {
                                $sql_unic_val+="["+$m['SYSNAME']+"],";
                            });
                        }
                        else if ($dbt=='ora') {
                            $tab_pok_cool.forEach(($m) => {
                                $sql_unic_val+="\""+$m['SYSNAME']+"\",";
                            });
                        }
                    }
                    $sql_unic_val=$sql_unic_val.slice(0, -1);
                    $sql_unic_val+=" ) ";
                    if ($dbt=='ora') {
                        $sql_unic_val+="SELECT * FROM (";
                    }
                    $sql_unic_val+="SELECT ";
                    $tab_str.forEach(($m) => {
                        $sql_unic_val+="0 "+$m['SYSNAME']+"_GRPNG_,";
                    });
                    if ($tab_pok_cool.length>0) {
                        $tab_pok_cool.forEach(($m) => {
                            $sql_unic_val+="0 "+$m['SYSNAME']+"_GRPNG_,";
                        });
                    }
                    $sql_unic_val+="TAB.* FROM TAB";
                    if ($dbt=='mssql') {
                        $sql_unic_val+=" ORDER BY ";
                    }
                    else if ($dbt=='ora') {
                        $sql_unic_val+=") ORDER BY ";
                    }

                    if ($dbt=='mssql') {
                        $tab_str.forEach(($m) => {
                            $sql_unic_val+="["+$m['SYSNAME']+"],";
                        });
                        if ($tab_pok.length>0) {
                            $tab_pok_cool.forEach(($m) => {
                                $sql_unic_val+="["+$m['SYSNAME']+"],";
                            });
                        }
                    }
                    else if ($dbt=='ora') {
                        $tab_str.forEach(($m) => {
                            $sql_unic_val+="\""+$m['SYSNAME']+"\",";
                        });
                        if ($tab_pok.length>0) {
                            $tab_pok_cool.forEach(($m) => {
                                $sql_unic_val+="\""+$m['SYSNAME']+"\",";
                            });
                        }
                    }

                    if ($dbt=='mssql') {
                        $tab_val.forEach(($m) => {
                            $sql_unic_val+="["+$m['SYSNAME']+"],";
                        });
                    }
                    else if ($dbt=='ora') {
                        $tab_val.forEach(($m) => {
                            $sql_unic_val+="\""+$m['SYSNAME']+"\",";
                        });
                    }
                    $sql_unic_val=$sql_unic_val.slice(0, -1);
                    $data['sql_unic_val']=$sql_unic_val;

                    let $rows_unic_val,
                        $rowCount_unic_val;
                    if ($dbt=='mssql') {
                        let $rows_unic_val_result = $conn.request();
                        $rows_unic_val_result=await $rows_unic_val_result.query($sql_unic_val);
                        $rows_unic_val=$rows_unic_val_result.recordsets[0];
                    }
                    else if ($dbt=='ora') {
                        const $rows_unic_val_result = await $conn.execute($sql_unic_val, {}, opts);
                        $rows_unic_val=$rows_unic_val_result.rows;
                    }
                    $rowCount_unic_val=$rows_unic_val.length;
                    $data['$rows_unic_val']=$rows_unic_val;
                    $data['$rowCount_unic_val']=$rowCount_unic_val;

                    //Построение таблицы
                    $data['tab_html']='<tbody>';
                    let $rows_unic_pok_one,
                        $max_count_pok=1;
                    if ($tab_pok.length>0) {
                        //верхняя часть таблицы (шапка с показателями)
                        //считаем максимальное количество комбинаций показателей*(кол-во значений показателей)
                        for (var i = 0; i < $tab_pok_cool.length; i++) {
                            //если равняется нулю, то ничего не строим, неправильная структура
                            if (+$tab_pok_cool[i]['COUNT']!==0) {
                                $max_count_pok*=$tab_pok_cool[i]['COUNT'];
                            }
                            else {
                                $data['pr_null']=778;
                                $data['pr_null_text']='Показатель "'+$tab_pok_cool[i]['SYSNAME']+'" не имеет ни одного значения, пожалуйста удалите его из структуры или перенесите в другое измерение';
                                res.status(200).json({ object: $data });
                                break;
                            }
                        }
                        $max_count_pok*=$tab_val.length;
                        $data['tab_html']+='<tr class="tr_pok null">';
                        $data['tab_html']+='    <td colspan="'+$tab_str.length+'" class="null" rowspan="'+($tab_pok.length*2+1)+'"></td>';
                        $data['tab_html']+='</tr>';
                        for (var $key_tpc = 0; $key_tpc < $tab_pok_cool.length; $key_tpc++) {
                            let $val_tpc=$tab_pok_cool[$key_tpc];
                            $data['tab_html']+='<tr class="tr_pok" id="'+$val_tpc['SYSNAME']+'">';
                            let valueL=$val_tpc['NAME'];
                            if (valueL===null) {
                                valueL='';
                            }
                            $data['tab_html']+='    <td class="td_pok_name" id="'+$val_tpc['SYSNAME']+'" colspan="'+$max_count_pok+'" draggable="true">'+valueL+'</td>';
                            $data['tab_html']+='</tr>';
                            $data['tab_html']+='<tr class="tr_pok" id="'+$val_tpc['SYSNAME']+'">';
                            let $max_count_pok_one=1;
                            for (var $i = ($key_tpc+1); $i < $tab_pok_cool.length; $i++) {
                                $max_count_pok_one*=$tab_pok_cool[$i]['COUNT'];
                            }
                            $max_count_pok_one*=$tab_val.length;
                            let $max_count_pok_one_before=1;
                            for (var $i = 0; $i <= ($key_tpc-1); $i++) {
                                $max_count_pok_one_before*=$tab_pok_cool[$i]['COUNT'];
                            }

                            $sql_unic_pok_cool_one="";
                            if ($dbt=='mssql') {
                                $sql_unic_pok_cool_one+="SET NOCOUNT ON;SET DATEFORMAT YMD;";
                            }
                            $sql_unic_pok_cool_one+="SELECT DISTINCT "+$val_tpc['SYSNAME']+
                                                   " FROM "+tab_temp+
                                                  " ORDER BY 1";
                            if ($dbt=='mssql') {
                                let $rows_unic_pok_one_result = $conn.request();
                                $rows_unic_pok_one_result=await $rows_unic_pok_one_result.query($sql_unic_pok_cool_one);
                                $rows_unic_pok_one=$rows_unic_pok_one_result.recordsets[0];
                            }
                            else if ($dbt=='ora') {
                                const $rows_unic_pok_one_result = await $conn.execute($sql_unic_pok_cool_one, {}, opts);
                                $rows_unic_pok_one=$rows_unic_pok_one_result.rows;
                            }
                            $data['$rows_unic_pok_one']=$rows_unic_pok_one;

                            for (var $i = 1; $i <= $max_count_pok_one_before; $i++) {
                                $rows_unic_pok_one.forEach(($mpok_ruo) => {
                                    let valueL=$mpok_ruo[$val_tpc['SYSNAME']];
                                    if (valueL===null) {
                                        valueL='';
                                    }
                                    $data['tab_html']+='<td class="td_pok" id="'+$val_tpc['SYSNAME']+'" colspan="'+$max_count_pok_one+'">'+valueL+'</td>';
                                });
                            }

                            $data['tab_html']+='</tr>';
                        }
                    }

                    //заголовки строк и значений показателей
                    $data['tab_html']+='<tr class="tr_name_col">';
                    $tab_str.forEach(($mstr) => {
                        let valueL=$mstr['NAME'];
                        if (valueL===null) {
                            valueL='';
                        }
                        $data['tab_html']+='<td class="td_str_name" id="'+$mstr['SYSNAME']+'" draggable="true">'
                                                +'<span><a class="tab_sort_up" id="'+$mstr['SYSNAME']+'" title="Отсортировать по возрастанию">'
                                                    + '<img src="/img/sort_up.png" style="width:7px;height:13px !important;">'
                                                + '</a></span>'
                                                +valueL
                                                +'<a class="tab_sort_unup" id="'+$mstr['SYSNAME']+'" title="Отсортировать по убыванию">'
                                                    + '<img src="/img/sort_unup.png" style="width:7px;height:13px !important;">'
                                                + '</a>  '
                                            +'</td>';
                    });

                    if ($tab_pok.length>0) {
                        for (var $i = 1; $i <= ($max_count_pok/$tab_val.length); $i++) {
                            $tab_val.forEach(($mval) => {
                                let valueL=$mval['NAME'];
                                if (valueL===null) {
                                    valueL='';
                                }
                                $data['tab_html']+='<td class="td_val_name" id="'+$mval['SYSNAME']+'" draggable="true">'
                                                    +'<a class="tab_sort_up" id="'+$mval['SYSNAME']+'" title="Отсортировать по возрастанию">'
                                                        + '<img src="/img/sort_up.png" style="width:7px;height:13px !important;">'
                                                    + '</a>'
                                                    +valueL
                                                    +'<a class="tab_sort_unup" id="'+$mval['SYSNAME']+'" title="Отсортировать по убыванию">'
                                                        + '<img src="/img/sort_unup.png" style="width:7px;height:13px !important;">'
                                                    + '</a>  '
                                                +'</td>';
                            });
                        }
                    }
                    else {
                        $tab_val.forEach(($mval) => {
                            let valueL=$mval['NAME'];
                            if (valueL===null) {
                                valueL='';
                            }
                            $data['tab_html']+='<td class="td_val_name" id="'+$mval['SYSNAME']+'" draggable="true">'
                                                    +'<a class="tab_sort_up" id="'+$mval['SYSNAME']+'" title="Отсортировать по возрастанию">'
                                                        + '<img src="/img/sort_up.png" style="width:7px;height:13px !important;">'
                                                    + '</a>'
                                                    +valueL
                                                    +'<a class="tab_sort_unup" id="'+$mval['SYSNAME']+'" title="Отсортировать по убыванию">'
                                                        + '<img src="/img/sort_unup.png" style="width:7px;height:13px !important;">'
                                                    + '</a>  '
                                                +'</td>';
                        });
                    }
                    //$data['tab_html']+='</tr><tr>';
                    //заполнение таблицы
                    $data['$rowCount_unic_val']=$rowCount_unic_val;

                    function create_table_one_str($data_rows_unic_val,$i_f) {
                      let $data_f=[];
                      $data_f['tab_html']='';
                      $data_f['$rows_unic_val']=$data_rows_unic_val;
                      //ПРОВЕРЯЕМ НА НАЛИЧИЕ ИТОГОВ
                      let $pr_itg=false;
                      if (!!$mass['tab_str_itog_order']) {
                          for (var i = 0; i < $tab_str.length; i++) {
                            let $m=$tab_str[i];
                            if (+$rows_unic_val[$i_f][$m['SYSNAME']+'_GRPNG_']===1) {
                                $pr_itg=true;
                                break;
                            }
                          }
                      }
                      //проверяем сменилась ли строка (все отсортировано),если сменилась, то надо перейти на новую
                      let $pr=false;
                      if ($i_f===0) {
                          $pr=true;
                          //виртуальная строка для удобства вычислений
                          $data_f['$rows_unic_val'][-1]=$data_f['$rows_unic_val'][0];
                          $data_f['$rows_unic_val'][-1]['$key_i']=0;
                      }
                      else {
                        for (var i = 0; i < $tab_str.length; i++) {
                            let $mstr=$tab_str[i];
                            if (String($rows_unic_val[$i_f][$mstr['SYSNAME']])!==String($rows_unic_val[$i_f-1][$mstr['SYSNAME']])) {
                                $data_f['$rows_unic_val'][$i_f-1]['$key_i']=0;
                                $pr=true;
                                //добавляем недостающие пустые ячейки
                                for (var i=1; i <= (count_pok_val-$tekCountVal); i++) {
                                    $data_f['tab_html']+='<td class="td_val_val" id="null"></td>';
                                }
                                break;
                            }
                        }
                      }
                      if ($pr) {
                          $data_f['tab_html']+='</tr><tr class="'+(($pr_itg) ? 'tr_itog':'tr_tab')+'">';
                          $tab_str.forEach(($m) => {
                              let valueL=$rows_unic_val[$i_f][$m['SYSNAME']];
                              if (valueL===null) {
                                  valueL='';
                              }
                              $data_f['tab_html']+='<td class="'+(($pr_itg) ? 'td_str_itog':'td_str_val')+'" id="'+$m['SYSNAME']+'">'+valueL+'</td>';
                          });
                          $tekCountVal=0;
                      }
                      //ищем номер набора показателей, который должен быть, чтобы если идут не по порядку добавить пустые ячейки
                      if ($tab_pok.length>0) {
                          if (!$pr_itg) {
                              for (var $key_i = 0; $key_i < $rows_unic_pok.length; $key_i++) {
                                  let $mpok_r=$rows_unic_pok[$key_i],
                                      $pr_ok_pok_one=true;
                                  for (var $keyp in $mpok_r) {
                                      let $valp=$mpok_r[$keyp];
                                      if (String($rows_unic_val[$i_f][$keyp])!==String($valp)) {
                                          $pr_ok_pok_one=false;
                                          break;
                                      }
                                  }
                                  if ($pr_ok_pok_one) {
                                      break;
                                  }
                              }
                          }
                          else {
                              $key_i=0;
                          }
                          let $key_i_calc=$key_i;
                          if (($pr) & ($key_i!==0)) {
                              ++$key_i_calc;
                          }
                          for (var $j_pok_null = ($data_f['$rows_unic_val'][$i_f-1]['$key_i']+1); $j_pok_null <= ($key_i_calc-1); $j_pok_null++) {
                              for (var $j_pok_null2 = 0; $j_pok_null2 < $tab_val.length; $j_pok_null2++) {
                                  $data_f['tab_html']+='<td class="td_val_val" id="null"></td>';
                                  ++$tekCountVal;
                              }
                          }
                          $data_f['$rows_unic_val'][$i_f]['$key_i']=$key_i;
                      }
                      $tab_val.forEach(($m) => {
                          ++$tekCountVal;
                          let valueL=$rows_unic_val[$i_f][$m['SYSNAME']];
                          if (valueL===null) {
                              valueL='';
                          }
                          $data_f['tab_html']+='<td class="'+(($pr_itg) ? 'td_val_itog':'td_val_val')+'" id="'+$m['SYSNAME']+'">'+valueL+'</td>';
                      });
                      return $data_f;
                  }

                    $data['$tab_str']=$tab_str;

                    //кол-во показателей помноженное на кол-во значений показателей (необходимо для
                    //подсчета кол-ва недостающих ячеек в строке в случае перехода на новую при отрисовки)
                    let count_pok_val;
                    if ($rows_unic_pok.length>0) {
                        count_pok_val=$rows_unic_pok.length*$tab_val.length;
                    }
                    else {
                        count_pok_val=$tab_val.length;
                    }
                    //текущее кол-во значений показателей в строке
                    let $tekCountVal=0;
                    for (var $i = 0; $i < $rowCount_unic_val; $i++) {
                        const $data_f=create_table_one_str($data['$rows_unic_val'],$i);
                        $data['$rows_unic_val']=$data_f['$rows_unic_val'];
                        $data['tab_html']+=$data_f['tab_html'];
                    }
                    //добавляем возможные недостающие пустые ячейки
                    for (var i=1; i <= (count_pok_val-$tekCountVal); i++) {
                        $data['tab_html']+='<td class="td_val_val" id="null"></td>';
                    }
                    $data['tab_html']+='</tr>';
                    $data['tab_html']+='</tbody>';
                }
                const time02 = performance.now();
                $data['timeCalc']=secondstotime(time02,time01);
                res.status(200).json({ object: $data,tokenOne:tokenOne });
              } catch (err) {
                next(err);
              }
              finally {
                if ($dbt=='ora') {
                  if ($conn) { // conn assignment worked, need to close
                    try {
                      await $conn.close();
                    } catch (err) {
                      console.log(err);
                    }
                  }
                }
              }
            }
            else {
              res.status(200).json({ message: 'Token false' })
            }
          });
        }
        else {
          res.status(200).json({ message: 'User not authorized' })
        }

}

module.exports.post = post;
