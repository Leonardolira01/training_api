/**
 * index - GET para listar vários registros.
 * show - GET para exibir um registro específico.
 * create - POST para criar um registro.
 * update - PUT para atualizar um registro.
 * delete - DELETE para remover um registro.
   */
const { hash, compare } = require("bcryptjs");
const AppError = require("../utils/AppError");

const UserRepository = require("../repositories/UserRepository");
const sqliteConnection = require("../database/sqlite");
const UserCreateService = require("../services/UserCreateService");
class UsersController {
    async create(request, response) {
      const { name, email, password } = request.body;

      const userRepository = new UserRepository();
      const userCreateService = new UserCreateService(userRepository);
      
      await userCreateService.execute({ name, email, password });

      return response.status(201).json();
  }

  async updade (request, response) {
    const { name, email, password, old_password } = request.body;
    const user_id = request.user.id;

    const database = await sqliteConnection();
    const user = await database.get("SELECT * FROM users WHERE id = (?)", [user_id]);

    if (!user) {
      throw new AppError("Usuário não encontrado");
    }

    const userWithUpdateEmail = await database.get("SELECT * FROM users WHERE email = (?)", [email]);

    if (userWithUpdateEmail && userWithUpdateEmail.id !== user.id){
      throw new AppError("Este e-mail já está em uso.");
    }

    user.name = name?? user.name; //se existir conteúdo dentro de nome esse é quem será utilizado, se não existir o que será utilizado sera o user.name, ou seja continuar o que já estava, o nullish operator ou é `esse` ou é `esse`
    user.email = email ?? user.email;

    //Se a pessoa digitou a senha nova e mas ela não digitou qual é a senha antiga vou dar erro
    if( password && !old_password ) 
      throw new AppError("Você precisa informa a senha antiga para definir a nova senha");

    //a próxima coisa que eu quero verificar é se tanto o password quanto o oldpassword for informado, entao agora quero fazer o seguinte, verificar se a senha antiga realmente ela é igual a que esta cadastrada no banco:
    if(password && old_password) {
      const checkOldPassword = await compare(old_password, user.password);
      //se isso for falço, significa que a senha antiga não é igual
      if(!checkOldPassword){
        throw new AppError("A senha antiga não confere.")
      }
      //se passou por tudo isso eu dou um user.password
      user.password = await hash(password, 8);
    }

    //atualize na tabela de usuários e faça o seguinte, defina seguinte valor:
    await database.run(`
      UPDATE users SET
      name = ?,
      email = ?,
      password = ?,
      updated_at = DATETIME('now') 
      WHERE id = ?`,
      [user.name, user.email, user.password, user_id]
    );

    return response.json();
  }
}

module.exports = UsersController;