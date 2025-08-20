import { Ok } from '_lessjs/core';
import { CustomRequest } from 'src/shared/types/express';

import { UserDto } from '../user.dto';

export const updateUser = (req: CustomRequest) => {
  const user = req.body as UserDto;
  return Ok({
    message: 'user updated',
    data: user,
  });
};
