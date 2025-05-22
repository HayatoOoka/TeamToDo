class Api::ApplicationController < ActionController::API
  # include ActionController::HttpAuthentication::Token::ControllerMethods # トークン認証を使う場合


  before_action :authenticate_request!

  private

  def authenticate_request!#この処理が必須で失敗した場合は中断させる意味合いを持たせたい時は関数名に！をつける
    token = request.headers['Authorization']&.split(' ')&.last
    if token
      begin
        decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, { algorithm: 'HS256' })
        @current_user = User.find(decoded_token[0]['user_id'])
      rescue JWT::DecodeError
        render json: { error: '認証に失敗しました' }, status: :unauthorized
      end
    else
      render json: { error: '認証トークンが必要です' }, status: :unauthorized
    end
  end
end