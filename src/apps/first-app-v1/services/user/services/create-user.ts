import { Ok } from '_lessjs/core';
import { CustomRequest } from 'src/shared/types/express';

import { UserDto } from '../user.dto';

export const createUser = (req: CustomRequest) => {
  console.log('createUser', req.body);
  const user = req.body as UserDto;
  return Ok({
    message: 'user created',
    data: user,
  });
};
