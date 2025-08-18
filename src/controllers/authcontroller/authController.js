import { 
  registerService, 
  loginService, 
  getAllUserService,
  updateUserService,
  deleteUserService 
} from "../../services/authService/authService.js";

export const registerHandler = async (req, reply) => {
  try {
    console.log('Received payload:', req.body);
    
    const { 
      mobileno, 
      email, 
      password, 
      firstName, 
      middleName, 
      lastName, 
      role = 'user',
      account_number 
    } = req.body;
    
    // Validation
    if (!mobileno || !email || !password || !firstName || !lastName) {
      return reply.code(400).send({ error: "Required fields missing" });
    }

    // Mobile number validation
    if (!/^\d{10}$/.test(mobileno)) {
      return reply.code(400).send({ error: "Mobile number must be exactly 10 digits" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reply.code(400).send({ error: "Invalid email format" });
    }

    const user = await registerService(
      mobileno,
      email, 
      password, 
      firstName, 
      middleName || '', 
      lastName, 
      role,
      account_number || ''
    );
    
    reply.code(201).send({
      message: "User registered successfully",
      user: user
    });
  } catch (err) {
    console.error('Registration error:', err);
    reply.code(400).send({ error: err.message });
  }
};

export const loginHandler = async (req, reply) => {
  try {
    const { mobileno, email, password } = req.body;
    
    const loginIdentifier = mobileno || email;
    
    if (!loginIdentifier || !password) {
      return reply.code(400).send({ error: "Login credentials required" });
    }

    const result = await loginService(loginIdentifier, password);
    reply.send(result);
  } catch (err) {
    reply.code(401).send({ error: err.message });
  }
};

export const getAllUsersHandler = async (req, reply) => {
  try {
    const users = await getAllUserService();
    reply.send(users);
  } catch (err) {
    reply.code(500).send({ error: err.message });
  }
};

export const updateUserHandler = async (req, reply) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    
    console.log('Update user handler - ID:', id, 'Data:', userData);
    
    if (!id) {
      return reply.code(400).send({ error: "User ID is required" });
    }

    const updatedUser = await updateUserService(id, userData);
    
    reply.send({
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error('Update user error:', err);
    reply.code(400).send({ error: err.message });
  }
};

export const deleteUserHandler = async (req, reply) => {
  try {
    const { id } = req.params;
    
    console.log('Delete user handler - ID:', id);
    
    if (!id) {
      return reply.code(400).send({ error: "User ID is required" });
    }

    await deleteUserService(id);
    
    reply.send({
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error('Delete user error:', err);
    reply.code(400).send({ error: err.message });
  }
};