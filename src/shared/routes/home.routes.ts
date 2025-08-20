import { router } from '_lessjs/core';

export const Router = router()
  .get('/', () => {
    return { message: 'Hello World', data: [] };
  })
  .build();

export default Router;
