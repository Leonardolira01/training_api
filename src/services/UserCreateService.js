class UserCreateService {
  async execute({ name, email, password }) {
    const userRepository = new UserRepository();

    const checkUserExists = await userRepository.findByEmail(email);

    if (checkUserExists) {
      throw new AppError("Este e-mail já está em uso.");
    }

    const hashedPassword = await hash(password, 8);

    await userRepository.create({ name, email, password: hashedPassword });
  }

}

module.exports = UserCreateService;