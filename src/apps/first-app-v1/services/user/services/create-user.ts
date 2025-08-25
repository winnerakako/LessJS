import { LessError } from '_lessjs/common';
import { Ok } from '_lessjs/core';
import { CustomRequest } from 'src/shared/types/express';

import { UserDto } from '../user.dto';

export const createUser = (req: CustomRequest) => {
  console.log('createUser', req.body);
  const user = req.body as UserDto;

  if (user.id === 1) throw LessError.badRequest('First ID is not allowed');

  return Ok({
    message: 'user created',
    data: user,
  });
};
