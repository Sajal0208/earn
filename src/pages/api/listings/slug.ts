import type { NextApiRequest, NextApiResponse } from 'next';
import slugify from 'slugify';

import { prisma } from '@/prisma';

const checkSlug = async (slug: string): Promise<boolean> => {
  try {
    const bounty = await prisma.bounties.findFirst({
      where: {
        slug,
      },
    });

    if (bounty) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const generateUniqueSlug = async (title: string): Promise<string> => {
  let slug = slugify(title, { lower: true, strict: true });
  let slugExists = await checkSlug(slug);
  let i = 1;

  while (slugExists) {
    const newTitle = `${title}-${i}`;
    slug = slugify(newTitle, { lower: true, strict: true });
    slugExists = await checkSlug(slug);
    i += 1;
  }

  return slug;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { slug, check } = req.query;

  if (check === 'true') {
    const slugExists = await checkSlug(slug as string);
    if (slugExists) {
      res.status(400).json({ slugExists: true, error: 'Slug already exists' });
      return;
    } else {
      res.status(200).json({ slugExists });
      return;
    }
  } else {
    const newSlug = await generateUniqueSlug(slug as string);

    res.status(200).json({ slug: newSlug });
  }
}