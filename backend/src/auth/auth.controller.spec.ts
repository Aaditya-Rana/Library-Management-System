import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
    let controller: AuthController;
    let authService: AuthService;

    const mockAuthService = {
        register: jest.fn(),
        login: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                {
                    provide: AuthService,
                    useValue: mockAuthService,
                },
            ],
        }).compile();

        controller = module.get<AuthController>(AuthController);
        authService = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should call authService.register with correct data', async () => {
            const registerDto: RegisterDto = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
            };

            const expectedResult = {
                success: true,
                message: 'Registration successful',
                data: { user: { id: '1', email: registerDto.email } },
            };

            mockAuthService.register.mockResolvedValue(expectedResult);

            const result = await controller.register(registerDto);

            expect(authService.register).toHaveBeenCalledWith(registerDto);
            expect(result).toEqual(expectedResult);
        });
    });

    describe('login', () => {
        it('should call authService.login with correct data', async () => {
            const loginDto: LoginDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            const expectedResult = {
                success: true,
                data: {
                    user: { id: '1', email: loginDto.email },
                    tokens: { accessToken: 'token', refreshToken: 'refresh' },
                },
            };

            mockAuthService.login.mockResolvedValue(expectedResult);

            const result = await controller.login(loginDto);

            expect(authService.login).toHaveBeenCalledWith(loginDto);
            expect(result).toEqual(expectedResult);
        });
    });
});
