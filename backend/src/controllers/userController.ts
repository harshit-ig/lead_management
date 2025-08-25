import { Request, Response } from 'express';
import User from '../models/User';
import type { CreateUserInput } from '../types';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter: any = {};
    if (role) {
      filter.role = role;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'user' }: CreateUserInput = req.body;

    // Validate input
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'All fields are required',
        errors: ['Please provide name, email, and password']
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        errors: ['Please provide a valid email address']
      });
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password too weak',
        errors: ['Password must be at least 6 characters long']
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists',
        errors: ['An account with this email already exists']
      });
      return;
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle specific MongoDB errors
    if (error instanceof Error && error.message.includes('E11000')) {
      res.status(400).json({
        success: false,
        message: 'User already exists',
        errors: ['An account with this email already exists']
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Prevent users from modifying their own role or active status
    if (req.user?.userId === id) {
      if (role !== undefined && role !== user.role) {
        res.status(400).json({
          success: false,
          message: 'Cannot modify your own role',
          errors: ['You cannot change your own role']
        });
        return;
      }
      
      if (isActive !== undefined && isActive !== user.isActive) {
        res.status(400).json({
          success: false,
          message: 'Cannot modify your own active status',
          errors: ['You cannot deactivate your own account']
        });
        return;
      }
    }

    // Update fields
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        res.status(400).json({
          success: false,
          message: 'Invalid name',
          errors: ['Name must be at least 2 characters long']
        });
        return;
      }
      user.name = name.trim();
    }

    if (role !== undefined) {
      if (!['admin', 'user'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
          errors: ['Role must be either admin or user']
        });
        return;
      }
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent users from deleting themselves
    if (req.user?.userId === id) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
        errors: ['You cannot delete your own account']
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};

export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await (User as any).getUserStats();

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user statistics',
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    });
  }
};
