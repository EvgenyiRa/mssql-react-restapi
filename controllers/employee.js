/*01*/const employees = require('../db_apis/employee.js');
/*02*/
/*03*/async function get(req, res, next) {
/*04*/  try {
/*05*/    const context = {};
/*06*/
/*07*/    context.id = parseInt(req.params.id, 10);
/*08*/
/*09*/    const rows = await employees.find(context);
/*10*/
/*11*/    if (req.params.id) {
/*12*/      if (rows.length === 1) {
/*13*/        res.status(200).json(rows[0]);
/*14*/      } else {
/*15*/        res.status(404).end();
/*16*/      }
/*17*/    } else {
/*18*/      res.status(200).json(rows);
/*19*/    }
/*20*/  } catch (err) {
/*21*/    next(err);
/*22*/  }
/*23*/}
/*24*/
/*25*/module.exports.get = get;
