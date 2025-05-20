class User < ApplicationRecord
    validates :name, presence: true #:presence => true は、「name は必須という意味
    validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP } #:uniqueness => true: テーブル内で一意である。email を持つレコードがデータベースに既に存在する場合、保存は失敗する。:format => { with: URI::MailTo::EMAIL_REGEXP }: email の値が指定された正規表現 (URI::MailTo::EMAIL_REGEXP) に合致するかどうかを検証します。
    has_secure_password #パスワードは password_digest カラムにハッシュ化されて保存されます。
  #新規ユーザー作成時には、password が必須で、最低6文字以上である必要があります。
    validates :password, presence: true, length: { minimum: 6 }, on: :create # 新規作成時のみパスワードの存在性と長さを検証
    has_many :members
    has_many :teams, through: :members
  end
  
