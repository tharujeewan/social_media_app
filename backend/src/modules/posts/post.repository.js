const { prisma } = require('../../config/db');

class PostRepository {
  // ✅ Create Post
  async create(data) {
    return prisma.post.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  // ✅ Get by ID
  async findById(id) {
    return prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true, // matching schema
          },
        },
        // interests: true, // commented out until added to schema
      },
    });
  }

  // ✅ Get All (basic)
  async findAll({ skip = 0, take = 10 }) {
    return prisma.post.findMany({
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  // ✅ Feed (based on user interests)
  async findFeedByInterests(interestIds, { skip = 0, take = 10 }) {
    return prisma.post.findMany({
      where: {
        interests: {
          some: {
            id: { in: interestIds },
          },
        },
      },
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
    });
  }

  // ✅ Update Post
  async update(id, data) {
    return prisma.post.update({
      where: { id },
      data,
    });
  }

  // ✅ Delete Post (Hard delete)
  async delete(id) {
    return prisma.post.delete({
      where: { id },
    });
  }

  // ✅ Soft Delete (Recommended instead of hard delete)
  async softDelete(id) {
    return prisma.post.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    });
  }

  // ✅ Check Ownership (for auth)
  async findByIdAndUser(postId, userId) {
    return prisma.post.findFirst({
      where: {
        id: postId,
        user_id: userId,
      },
    });
  }

  // ✅ Search (basic)
  async search(query, { skip = 0, take = 10 }) {
    return prisma.post.findMany({
      where: {
        OR: [
          { caption: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take,
      orderBy: { created_at: 'desc' },
    });
  }
}

module.exports = new PostRepository();