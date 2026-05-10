'use server';

import { requireSession } from '@/lib/session';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';

export async function uploadProfilePhoto(formData: FormData) {
  try {
    const session = await requireSession();
    if (!session || !session.userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('photo') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    // Basic validation
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' };
    }

    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      return { success: false, error: 'File size must be less than 5MB' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name) || '.jpg';
    const filename = `profile_${session.userId}_${Date.now()}${ext}`;
    
    // Ensure the upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);

    const publicUrl = `/uploads/profiles/${filename}`;

    await db.user.update({
      where: { id: session.userId },
      data: { profilePhotoUrl: publicUrl },
    });

    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true, url: publicUrl };
  } catch (error: unknown) {
    console.error('Error uploading profile photo:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to upload photo' };
  }
}

export async function updateProfileDetails(formData: FormData) {
  try {
    const session = await requireSession();
    if (!session || !session.userId) {
      return { success: false, error: 'Not authenticated' };
    }

    const firstName = formData.get('firstName')?.toString().trim() || null;
    const lastName = formData.get('lastName')?.toString().trim() || null;

    await db.user.update({
      where: { id: session.userId },
      data: {
        firstName,
        lastName,
      },
    });

    revalidatePath('/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    console.error('Error updating profile details:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update details' };
  }
}
