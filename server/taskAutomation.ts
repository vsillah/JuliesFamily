import type { IStorage } from "./storage";
import type { InsertTask, Lead } from "@shared/schema";

// Task templates for different triggers
interface TaskTemplate {
  title: string;
  description: string;
  taskType: 'call' | 'email' | 'meeting' | 'follow_up' | 'send_materials' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  daysUntilDue: number;
}

// Default task templates for new leads by persona
const NEW_LEAD_TEMPLATES: Record<string, TaskTemplate> = {
  student: {
    title: 'Initial outreach to prospective student',
    description: 'Reach out to introduce programs, answer questions, and understand their educational goals.',
    taskType: 'call',
    priority: 'high',
    daysUntilDue: 1,
  },
  parent: {
    title: 'Follow up with parent inquiry',
    description: 'Contact parent to discuss children\'s services, answer questions about enrollment, and schedule a visit.',
    taskType: 'call',
    priority: 'high',
    daysUntilDue: 1,
  },
  provider: {
    title: 'Connect with service provider',
    description: 'Reach out to discuss partnership opportunities and referral process.',
    taskType: 'email',
    priority: 'medium',
    daysUntilDue: 2,
  },
  donor: {
    title: 'Thank donor and provide impact info',
    description: 'Send thank you message and share how their support makes a difference.',
    taskType: 'email',
    priority: 'medium',
    daysUntilDue: 1,
  },
  volunteer: {
    title: 'Follow up on volunteer interest',
    description: 'Contact volunteer to discuss opportunities, availability, and next steps for onboarding.',
    taskType: 'call',
    priority: 'medium',
    daysUntilDue: 2,
  },
};

// Task templates for pipeline stage changes
const STAGE_CHANGE_TEMPLATES: Record<string, TaskTemplate> = {
  new_lead: {
    title: 'Make first contact with new lead',
    description: 'Introduce yourself, understand their needs, and schedule follow-up.',
    taskType: 'call',
    priority: 'high',
    daysUntilDue: 1,
  },
  contacted: {
    title: 'Send follow-up materials',
    description: 'Send program information, enrollment forms, or requested materials.',
    taskType: 'email',
    priority: 'medium',
    daysUntilDue: 2,
  },
  qualified: {
    title: 'Schedule enrollment meeting',
    description: 'Set up meeting to discuss program details, answer questions, and begin enrollment process.',
    taskType: 'meeting',
    priority: 'high',
    daysUntilDue: 3,
  },
  nurturing: {
    title: 'Check in with prospect',
    description: 'Reach out to answer any questions and see if they\'re ready to move forward.',
    taskType: 'call',
    priority: 'medium',
    daysUntilDue: 7,
  },
  enrolled: {
    title: 'Welcome and onboard new participant',
    description: 'Provide orientation information, schedule first session, and ensure smooth start.',
    taskType: 'email',
    priority: 'high',
    daysUntilDue: 1,
  },
};

/**
 * Automatically create a task when a new lead is created
 */
export async function createTaskForNewLead(
  storage: IStorage,
  lead: Lead,
  assignedTo?: string
): Promise<void> {
  try {
    // Get task template based on lead persona
    const template = NEW_LEAD_TEMPLATES[lead.persona] || NEW_LEAD_TEMPLATES.student;
    
    // Find assignee - use provided assignedTo, or get lead's assignment, or find first admin
    let taskAssignee = assignedTo;
    
    if (!taskAssignee) {
      // Check if lead has an assignment
      const assignments = await storage.getLeadAssignments({ leadId: lead.id });
      if (assignments.length > 0) {
        taskAssignee = assignments[0].assignedTo;
      }
    }
    
    if (!taskAssignee) {
      // Fall back to first admin user
      const allUsers = await storage.getAllUsers();
      const admin = allUsers.find((u: any) => u.isAdmin);
      if (!admin) {
        console.warn('No admin users found to assign automated task');
        return;
      }
      taskAssignee = admin.id;
    }
    
    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + template.daysUntilDue);
    
    // Create automated task
    const taskData: InsertTask = {
      leadId: lead.id,
      assignedTo: taskAssignee,
      createdBy: null, // Null for automated tasks
      title: template.title,
      description: template.description,
      taskType: template.taskType,
      priority: template.priority,
      status: 'pending',
      dueDate,
      completedAt: null,
      isAutomated: true,
    };
    
    await storage.createTask(taskData);
    console.log(`Automated task created for new lead: ${lead.id} (${lead.persona})`);
  } catch (error) {
    console.error('Error creating automated task for new lead:', error);
    // Don't throw - we don't want to fail lead creation if task creation fails
  }
}

/**
 * Automatically create a task when a lead's pipeline stage changes
 */
export async function createTaskForStageChange(
  storage: IStorage,
  lead: Lead,
  newStage: string,
  assignedTo?: string
): Promise<void> {
  try {
    // Skip creating tasks for terminal stages
    if (newStage === 'converted' || newStage === 'lost') {
      return;
    }
    
    // Get task template based on new stage
    const template = STAGE_CHANGE_TEMPLATES[newStage];
    if (!template) {
      console.log(`No task template for stage: ${newStage}`);
      return;
    }
    
    // Find assignee
    let taskAssignee = assignedTo;
    
    if (!taskAssignee) {
      const assignments = await storage.getLeadAssignments({ leadId: lead.id });
      if (assignments.length > 0) {
        taskAssignee = assignments[0].assignedTo;
      }
    }
    
    if (!taskAssignee) {
      const allUsers = await storage.getAllUsers();
      const admin = allUsers.find((u: any) => u.isAdmin);
      if (!admin) {
        console.warn('No admin users found to assign automated task');
        return;
      }
      taskAssignee = admin.id;
    }
    
    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + template.daysUntilDue);
    
    // Create automated task
    const taskData: InsertTask = {
      leadId: lead.id,
      assignedTo: taskAssignee,
      createdBy: null,
      title: template.title,
      description: template.description,
      taskType: template.taskType,
      priority: template.priority,
      status: 'pending',
      dueDate,
      completedAt: null,
      isAutomated: true,
    };
    
    await storage.createTask(taskData);
    console.log(`Automated task created for stage change: ${lead.id} → ${newStage}`);
  } catch (error) {
    console.error('Error creating automated task for stage change:', error);
  }
}

/**
 * Check for overdue tasks and create follow-up tasks
 */
export async function createTasksForMissedFollowUps(
  storage: IStorage
): Promise<void> {
  try {
    const now = new Date();
    
    // Get all pending tasks that are overdue
    const allTasks = await storage.getTasks({ status: 'pending' });
    const overdueTasks = allTasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now;
    });
    
    console.log(`Found ${overdueTasks.length} overdue tasks`);
    
    // For each overdue task, create a high-priority follow-up task
    for (const overdueTask of overdueTasks) {
      // Check if there's already a follow-up task for this lead
      const leadTasks = await storage.getTasks({ 
        leadId: overdueTask.leadId,
        status: 'pending'
      });
      
      const hasRecentFollowUp = leadTasks.some(task => {
        if (task.id === overdueTask.id) return false;
        if (task.taskType !== 'follow_up') return false;
        // Check if created in the last 24 hours
        const taskAge = now.getTime() - new Date(task.createdAt!).getTime();
        return taskAge < 24 * 60 * 60 * 1000; // 24 hours in ms
      });
      
      if (hasRecentFollowUp) {
        continue; // Skip if there's already a recent follow-up task
      }
      
      // Create follow-up task
      const followUpDueDate = new Date();
      followUpDueDate.setDate(followUpDueDate.getDate() + 1); // Due tomorrow
      
      const taskData: InsertTask = {
        leadId: overdueTask.leadId,
        assignedTo: overdueTask.assignedTo,
        createdBy: null,
        title: `Follow up on overdue: ${overdueTask.title}`,
        description: `Original task "${overdueTask.title}" was due on ${new Date(overdueTask.dueDate!).toLocaleDateString()}. Please follow up urgently.`,
        taskType: 'follow_up',
        priority: 'urgent',
        status: 'pending',
        dueDate: followUpDueDate,
        completedAt: null,
        isAutomated: true,
      };
      
      await storage.createTask(taskData);
      console.log(`Created follow-up task for overdue task: ${overdueTask.id}`);
    }
  } catch (error) {
    console.error('Error creating tasks for missed follow-ups:', error);
  }
}
