# One exception type the stores raise and the route layer turns into a
# JSON error response, so business rules live in one place (the stores)
# and the HTTP layer stays thin.


class StoreError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status
